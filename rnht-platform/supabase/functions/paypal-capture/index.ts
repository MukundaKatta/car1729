// Supabase Edge Function: paypal-capture
//
// Captures a PayPal order after the donor approves. The client posts the
// PayPal order ID returned in the callback URL; we hit PayPal's capture
// endpoint and mark the matching donations row as paid.
//
// Required secrets:
//   PAYPAL_CLIENT_ID
//   PAYPAL_SECRET
//   PAYPAL_MODE                  "live" or "sandbox"
//
// Supabase auto-provides SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { fundLabels } from "../_shared/fund-labels.ts";
import { sendDonationReceipt, receiptNumberFor } from "../_shared/receipt.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") ?? "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function paypalAccessToken(): Promise<string> {
  const base = PAYPAL_MODE === "live"
    ? "api.paypal.com"
    : "api.sandbox.paypal.com";
  const res = await fetch(`https://${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    // A missing/blank/non-JSON body is a client error (400), not a 500.
    let body: { orderId?: string };
    try {
      body = (await req.json()) as { orderId?: string };
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    const orderId = body?.orderId;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const base = PAYPAL_MODE === "live"
      ? "api.paypal.com"
      : "api.sandbox.paypal.com";
    const token = await paypalAccessToken();

    const captureRes = await fetch(
      `https://${base}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    const captureData: any = await captureRes.json();

    if (!captureRes.ok) {
      console.error("PayPal capture HTTP error:", captureRes.status, captureData);
      return new Response(
        JSON.stringify({ error: "PayPal capture failed", status: captureData?.name ?? "ERROR" }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const unit = captureData?.purchase_units?.[0];
    const donationId = unit?.reference_id ?? null;
    const capturedValue = Number(
      unit?.payments?.captures?.[0]?.amount?.value ?? NaN,
    );

    if (captureData.status === "COMPLETED" && donationId) {
      // Load the donation this order claims to pay for, and verify the captured
      // amount matches what we recorded — prevents a replayed/forged order id
      // from flipping an unrelated donation to "completed".
      const { data: donation } = await supabase
        .from("donations")
        .select("amount, fund_type, payment_status, donor_email, donor_name, user_id")
        .eq("id", donationId)
        .maybeSingle();

      if (!donation) {
        return new Response(JSON.stringify({ error: "Unknown donation" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }

      const expected = Number(donation.amount);
      if (!Number.isFinite(capturedValue) || Math.abs(capturedValue - expected) > 0.01) {
        console.error("PayPal amount mismatch", { donationId, capturedValue, expected });
        return new Response(JSON.stringify({ error: "Amount mismatch" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      // Idempotent: only flip pending -> completed. A replay (already completed)
      // updates zero rows and simply returns the existing record below.
      const { data: updated, error: flipError } = await supabase
        .from("donations")
        .update({ payment_status: "completed", payment_intent_id: orderId })
        .eq("id", donationId)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();

      // Surface a DB failure on the flip. PayPal has ALREADY captured the money
      // at this point, so a swallowed error here means the donor paid but the
      // row is stuck 'pending' with no receipt — must be visible for reconcile.
      if (flipError) {
        console.error("[paypal-capture] failed to flip donation to completed", {
          donationId,
          orderId,
          error: flipError.message,
        });
      }

      // Send the receipt only when this capture wins the completion — but a
      // parallel completer (the deployed PayPal webhook) can flip the row
      // first, leaving 0 rows updated and the donor with no email. Claim the
      // receipt exactly once via the payment_intent_id marker (only capture
      // paths write it); replays find it set and stay silent.
      // Claim on tax_receipt_sent, not payment_intent_id: this rail stamps
      // payment_intent_id at ORDER CREATION (donate/index.ts), so the old
      // `.is(payment_intent_id, null)` claim could never match and was dead
      // code — and the admin "Mark received" path sends a receipt without
      // touching it, which would let a later capture send a second one.
      const { data: claimed, error: claimError } = await supabase
        .from("donations")
        .update({ tax_receipt_sent: true })
        .eq("id", donationId)
        .eq("payment_status", "completed")
        .eq("tax_receipt_sent", false)
        .select("id")
        .maybeSingle();
      if (claimError) {
        console.error("[paypal-capture] receipt claim failed", {
          donationId,
          error: claimError.message,
        });
      }
      const wonReceipt = Boolean(claimed);
      if (wonReceipt) {
        // Back-link guest gifts to a matching devotee account by email, same
        // as the Stripe verify + manual cash paths, so the donation reaches
        // the donor's dashboard and year-end acknowledgment.
        if (!donation.user_id && donation.donor_email) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            // Exact match: ilike treats "_"/"%" in the donor address as SQL
            // wildcards and can link the gift to the wrong devotee.
            .eq("email", donation.donor_email.trim().toLowerCase())
            .maybeSingle();
          if (prof?.id) {
            const { error: linkError } = await supabase
              .from("donations")
              .update({ user_id: prof.id })
              .eq("id", donationId)
              .is("user_id", null);
            if (linkError) {
              console.error("[paypal-capture] back-link failed", {
                donationId,
                error: linkError.message,
              });
            }
          }
        }
        await sendDonationReceipt({
          to: donation.donor_email,
          donorName: donation.donor_name,
          amount: expected,
          fundLabel: fundLabels[donation.fund_type] ?? "Temple Fund",
          receiptNumber: receiptNumberFor(donation.id),
        });
      }

      return new Response(
        JSON.stringify({
          status: captureData.status,
          // DECIMAL comes back as a string from Supabase — coerce to number.
          amount: Number(donation.amount),
          fundType: donation.fund_type,
          fundLabel: fundLabels[donation.fund_type] ?? "Temple Fund",
        }),
        { headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({ status: captureData.status ?? "UNKNOWN" }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    console.error("PayPal capture error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to capture PayPal payment" }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
