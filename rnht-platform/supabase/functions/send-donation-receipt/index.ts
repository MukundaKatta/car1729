// Supabase Edge Function: send-donation-receipt
//
// Emails the tax-deductible thank-you receipt for a donation an ADMIN has just
// marked received (a Zelle pledge confirmed in the temple's bank). The admin
// "Mark received" button calls this best-effort right after flipping the
// pledge to completed. Stripe/PayPal completions already send their receipt in
// the donate / paypal-capture functions; this covers the manual Zelle path.
//
// The caller must be an admin (their session token is passed in x-user-token
// and checked against profiles.is_admin) so this can't be used to spam
// receipts to arbitrary addresses.
//
// Secrets: RESEND_API_KEY, RECEIPT_FROM (shared with the other receipt paths).
// Supabase auto-provides SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { fundLabels } from "../_shared/fund-labels.ts";
import { sendDonationReceipt, receiptNumberFor } from "../_shared/receipt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function callerIsAdmin(req: Request): Promise<boolean> {
  const token = req.headers.get("x-user-token") ?? "";
  if (!token) return false;
  const { data, error } = await admin.auth.getUser(token);
  const userId = data?.user?.id;
  if (error || !userId) return false;
  const { data: prof } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return prof?.is_admin === true;
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
    if (!(await callerIsAdmin(req))) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    let body: { donationId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    const donationId = body?.donationId;
    if (!donationId || typeof donationId !== "string") {
      return new Response(JSON.stringify({ error: "donationId is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const { data: d, error } = await admin
      .from("donations")
      .select("donor_email, donor_name, amount, fund_type, payment_status, is_anonymous")
      .eq("id", donationId)
      .maybeSingle();
    if (error || !d) {
      return new Response(JSON.stringify({ error: "Donation not found" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }
    // Only receipt a gift that has actually been recorded as received — guards
    // against emailing a "receipt" for a pledge that's still pending.
    if (d.payment_status !== "completed") {
      return new Response(JSON.stringify({ error: "Donation is not completed" }), {
        status: 409,
        headers: jsonHeaders,
      });
    }
    if (!d.donor_email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no donor email" }), {
        headers: jsonHeaders,
      });
    }

    // Prefer the admin-managed fund name, then the legacy label, then the slug.
    const { data: ft } = await admin
      .from("donation_types")
      .select("name")
      .eq("slug", d.fund_type)
      .maybeSingle();
    const fundLabel =
      ft?.name ?? fundLabels[d.fund_type as string] ?? (d.fund_type as string) ?? "Donation";

    // Compete for the same single-sender claim the payment-verify paths use,
    // so a donation the donor already received a receipt for (or one being
    // verified concurrently) never gets a second 501(c)(3) receipt.
    const { data: claimed } = await admin
      .from("donations")
      .update({ tax_receipt_sent: true })
      .eq("id", donationId)
      .eq("payment_status", "completed")
      .eq("tax_receipt_sent", false)
      .select("id")
      .maybeSingle();
    if (!claimed) {
      return new Response(
        JSON.stringify({ ok: true, alreadySent: true }),
        { headers: jsonHeaders },
      );
    }
    await sendDonationReceipt({
      to: d.donor_email as string,
      donorName: d.is_anonymous ? null : (d.donor_name as string | null),
      amount: Number(d.amount ?? 0),
      fundLabel,
      receiptNumber: receiptNumberFor(donationId),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (err) {
    console.error("send-donation-receipt error:", err);
    return new Response(JSON.stringify({ error: "Failed to send receipt" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
