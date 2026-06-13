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
import { sendDonationReceipt } from "../_shared/receipt.ts";

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
    const body = (await req.json()) as { orderId?: string };
    const orderId = body.orderId;
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
        .select("amount, fund_type, payment_status, donor_email, donor_name")
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
      const { data: updated } = await supabase
        .from("donations")
        .update({ payment_status: "completed", payment_intent_id: orderId })
        .eq("id", donationId)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();

      // Send the receipt only on the actual transition (updated !== null), so a
      // replayed capture doesn't email the donor twice.
      if (updated) {
        await sendDonationReceipt({
          to: donation.donor_email,
          donorName: donation.donor_name,
          amount: expected,
          fundLabel: fundLabels[donation.fund_type] ?? "Temple Fund",
        });
      }

      return new Response(
        JSON.stringify({
          status: captureData.status,
          amount: donation.amount,
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
