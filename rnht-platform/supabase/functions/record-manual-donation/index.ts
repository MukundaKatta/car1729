// Supabase Edge Function: record-manual-donation
//
// Records a CASH / OFFLINE donation an ADMIN (Pandit Ji) has received in person,
// then emails the donor an official receipt PDF and files the gift in donation
// history so it shows in the yearly report. This backs the admin "Record
// Donation → Generate & Send Receipt" flow.
//
// The receipt PDF is generated CLIENT-SIDE (jsPDF, in the admin browser, using
// the same letterhead/signature/stamp as the year-end acknowledgment) and sent
// here as base64 so the exact document the admin previewed is what the donor
// receives — no server-side PDF rendering to keep in sync.
//
// The caller must be an admin: their session token is passed in x-user-token and
// checked against profiles.is_admin, so this can't be used to insert arbitrary
// donations or spam receipts. The insert uses the service-role client, so it is
// not subject to the donations RLS policies.
//
// Secrets: RESEND_API_KEY, RECEIPT_FROM (shared with the other receipt paths).
// Supabase auto-provides SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { fundLabels } from "../_shared/fund-labels.ts";
import { sendDonationReceiptPdf } from "../_shared/receipt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns the caller's user id if they are an admin, else null.
async function adminUserId(req: Request): Promise<string | null> {
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

interface ManualDonationBody {
  id?: string;
  donorName?: string;
  donorEmail?: string;
  donorAddress?: string;
  amount?: number;
  fundType?: string;
  note?: string;
  receiptId?: string;
  pdfBase64?: string;
  filename?: string;
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
    const adminId = await adminUserId(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    let body: ManualDonationBody;
    try {
      body = (await req.json()) as ManualDonationBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const id = (body.id ?? "").trim();
    const donorName = (body.donorName ?? "").trim();
    const donorEmail = (body.donorEmail ?? "").trim();
    const donorAddress =
      typeof body.donorAddress === "string" ? body.donorAddress.trim().slice(0, 500) : "";
    const fundType = (body.fundType ?? "").trim();
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const amount = Number(body.amount);

    // The client supplies the row id so the receipt number (REC-<id8>) printed
    // on the already-generated PDF matches the stored donation. Require a valid
    // UUID; the donations id column is a uuid PK.
    if (!UUID_RE.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid donation id" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    if (!donorName) {
      return new Response(JSON.stringify({ error: "Donor name is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    if (!donorEmail || !EMAIL_RE.test(donorEmail)) {
      return new Response(JSON.stringify({ error: "A valid donor email is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return new Response(JSON.stringify({ error: "Invalid donation amount" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Allowlist the fund exactly like the public donate function: an ACTIVE row
    // in donation_types (admin-managed) OR a hardcoded fundLabels key. Reject
    // anything else so a crafted call can't file an arbitrary fund name.
    const { data: fundRow } = await admin
      .from("donation_types")
      .select("name")
      .eq("slug", fundType)
      .eq("is_active", true)
      .maybeSingle();
    const inFundLabels =
      !!fundType && Object.prototype.hasOwnProperty.call(fundLabels, fundType);
    if (!fundRow && !inFundLabels) {
      return new Response(JSON.stringify({ error: "Unknown donation fund" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Authoritative server-side rounding to whole cents (never trust the client).
    const cleanAmount = Math.round(amount * 100) / 100;
    if (cleanAmount <= 0) {
      return new Response(JSON.stringify({ error: "Donation amount is too small" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const receiptId =
      typeof body.receiptId === "string" && body.receiptId.trim()
        ? body.receiptId.trim()
        : `REC-${id.slice(0, 8)}`;

    // If the donor already has a temple account (matched by email), link the
    // gift to it so it also shows in their dashboard + counts toward the
    // year-end acknowledgment total (which loads donations by user_id). This is
    // best-effort: if the profiles table has no email column or the lookup
    // errors, we fall back to an unlinked gift (still recorded + receipted).
    let linkedUserId: string | null = null;
    try {
      // profiles.email is stored lowercased (migration 009 trigger); match on
      // the normalized form so "Ramesh@Gmail.com" still links (gap I).
      const { data: prof } = await admin
        .from("profiles")
        .select("id")
        .eq("email", donorEmail.trim().toLowerCase())
        .maybeSingle();
      if (prof?.id) linkedUserId = prof.id as string;
    } catch (e) {
      console.error("[manual-donation] profile email lookup failed:", e);
    }

    // File the gift as a COMPLETED cash donation (the money is already in hand),
    // stamped so it's distinguishable from online gifts in the records.
    const { error: insErr } = await admin.from("donations").insert({
      id,
      user_id: linkedUserId,
      donor_name: donorName,
      donor_email: donorEmail,
      amount: cleanAmount,
      fund_type: fundType,
      payment_method: "cash",
      payment_status: "completed",
      is_recurring: false,
      message: note || null,
      is_anonymous: false,
      // The emailed/downloaded PDF IS this gift's receipt: mark it issued so a
      // later send-donation-receipt call can't mail a second, plain receipt (gap M).
      tax_receipt_sent: true,
      custom_fields: {
        source: "manual_admin",
        recorded_by: adminId,
        receipt_id: receiptId,
        // Full mailing address for the year-end IRS acknowledgment (CPA request).
        ...(donorAddress ? { donor_address: donorAddress } : {}),
      },
    });
    if (insErr) {
      console.error("[manual-donation] insert error:", insErr);
      // A duplicate id means this exact submission already succeeded (a retried
      // request); treat it as an idempotent success so the client doesn't file
      // the gift a second time under a fresh id. Don't re-email (the first
      // attempt already sent it).
      if (insErr.code === "23505") {
        return new Response(
          JSON.stringify({ ok: true, donationId: id, receiptId, emailed: false, duplicate: true }),
          { headers: jsonHeaders },
        );
      }
      // A CHECK violation (23514) means migration 007 (which allows the 'cash'
      // method) hasn't been applied yet — the feature isn't fully configured.
      // Return a clear, generic message; never leak the raw Postgres/constraint
      // text (kept in the server log above).
      if (insErr.code === "23514") {
        return new Response(
          JSON.stringify({
            error:
              "The donation service isn't fully configured yet. Please try again shortly or contact the temple.",
          }),
          { status: 503, headers: jsonHeaders },
        );
      }
      return new Response(
        JSON.stringify({
          error: "Could not save the donation. Please try again or contact the temple.",
        }),
        { status: 500, headers: jsonHeaders },
      );
    }

    // Best-effort: email the donor their receipt PDF. Never fail the request if
    // email is down — the gift is already saved and the admin has the PDF.
    let emailed = false;
    let pdf = typeof body.pdfBase64 === "string" ? body.pdfBase64.trim() : "";
    // Strip a data-URI prefix ("data:application/pdf;base64,…") if the client
    // sent one — Resend wants the bare base64.
    if (pdf.startsWith("data:")) {
      const comma = pdf.indexOf(",");
      if (comma !== -1) pdf = pdf.slice(comma + 1);
    }
    if (pdf && pdf.length <= 10_000_000) {
      const filename =
        typeof body.filename === "string" && body.filename.trim()
          ? body.filename.trim()
          : `RNHT-Donation-Receipt-${receiptId}.pdf`;
      emailed = await sendDonationReceiptPdf({
        to: donorEmail,
        donorName,
        pdfBase64: pdf,
        filename,
      });
    } else if (pdf) {
      // Oversized attachment — skip the email but keep the (already saved) gift.
      console.error("[manual-donation] pdfBase64 too large, skipping email:", pdf.length);
    }

    return new Response(
      JSON.stringify({ ok: true, donationId: id, receiptId, emailed }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    console.error("record-manual-donation error:", err);
    return new Response(JSON.stringify({ error: "Failed to record donation" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
