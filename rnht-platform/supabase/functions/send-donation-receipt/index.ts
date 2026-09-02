// Supabase Edge Function: send-donation-receipt
//
// Emails the tax-deductible thank-you receipt for a donation an ADMIN has just
// marked received (a Zelle pledge confirmed in the temple's bank). The admin
// "Mark received" button calls this best-effort right after flipping the
// pledge to completed. Stripe/PayPal completions already send their receipt in
// the donate / paypal-capture functions; this covers the manual Zelle path.
//
// Body: { donationId: string, force?: boolean }
//   - default: single-winner claim on donations.tax_receipt_sent — a gift that
//     already has a receipt (or is being receipted concurrently) is skipped
//     with { ok: true, alreadySent: true }.
//   - force: true  — admin "Resend receipt". Re-emails the receipt even when
//     tax_receipt_sent is already true (e.g. the original send was rejected by
//     the email provider while the flag was still set). Still refuses any
//     donation that is not payment_status = 'completed'. Responds
//     { ok: true, resent: true } when the provider accepted the email, or 502
//     with the provider's reason when it didn't.
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

/** The calling admin's user id, or null when the caller is not an admin. */
async function callerAdminId(req: Request): Promise<string | null> {
  const token = req.headers.get("x-user-token") ?? "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  const userId = data?.user?.id;
  if (error || !userId) return null;
  const { data: prof } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return prof?.is_admin === true ? userId : null;
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
    const adminId = await callerAdminId(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    let body: { donationId?: string; force?: boolean };
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
    // Strict boolean: only a literal `true` resends (never a truthy string).
    const force = body?.force === true;

    const { data: d, error } = await admin
      .from("donations")
      .select("donor_email, donor_name, amount, fund_type, payment_status, is_anonymous, created_at")
      .eq("id", donationId)
      .maybeSingle();
    if (error || !d) {
      return new Response(JSON.stringify({ error: "Donation not found" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }
    // Only receipt a gift that has actually been recorded as received — guards
    // against emailing a "receipt" for a pledge that's still pending. Applies
    // to force too: a resend can never receipt a non-completed row.
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
    //
    // With force the tax_receipt_sent=false condition is dropped, but the
    // update is still guarded on payment_status='completed' (re-checked
    // atomically here, not just in the read above) and still sets the flag.
    const claim = admin
      .from("donations")
      .update({ tax_receipt_sent: true })
      .eq("id", donationId)
      .eq("payment_status", "completed");
    const { data: claimed } = await (force ? claim : claim.eq("tax_receipt_sent", false))
      .select("id")
      .maybeSingle();
    if (!claimed) {
      if (force) {
        // The row stopped being completed (or vanished) between the read and
        // the guarded update — never resend for it.
        return new Response(JSON.stringify({ error: "Donation is not completed" }), {
          status: 409,
          headers: jsonHeaders,
        });
      }
      return new Response(
        JSON.stringify({ ok: true, alreadySent: true }),
        { headers: jsonHeaders },
      );
    }

    if (force) {
      console.log(
        `[receipt] audit: admin ${adminId} force-resend requested for receipt ${receiptNumberFor(donationId)} ` +
          `for donation ${donationId}`,
      );
      // A resend of an older gift must carry the gift's own date, not today's.
      const result = await sendDonationReceipt({
        to: d.donor_email as string,
        donorName: d.is_anonymous ? null : (d.donor_name as string | null),
        amount: Number(d.amount ?? 0),
        fundLabel,
        receiptNumber: receiptNumberFor(donationId),
        date: (d.created_at as string | null) ?? null,
      });
      if (!result.sent) {
        console.error(
          `[receipt] audit: admin ${adminId} force-resend for donation ${donationId} failed: ${result.reason}`,
        );
        return new Response(
          JSON.stringify({ error: `Receipt was not sent: ${result.reason}` }),
          { status: 502, headers: jsonHeaders },
        );
      }
      console.log(`[receipt] audit: admin ${adminId} force-resent receipt ${receiptNumberFor(donationId)} for donation ${donationId}`);
      return new Response(JSON.stringify({ ok: true, resent: true }), { headers: jsonHeaders });
    }

    await sendDonationReceipt({
      to: d.donor_email as string,
      donorName: d.is_anonymous ? null : (d.donor_name as string | null),
      amount: Number(d.amount ?? 0),
      fundLabel,
      receiptNumber: receiptNumberFor(donationId),
          date: (d.created_at as string | null) ?? null,
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
