import { Resend } from "resend";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Tax-receipt summary email at the $750/year threshold.
 *
 * Wiring: call `checkAndSendReceipt(userId)` from the webhook that marks a
 * donation `completed` (Stripe + PayPal). The function:
 *   1. Sums the current calendar year's completed donations for the user
 *   2. If the total is >= $750 AND at least one donation hasn't been marked
 *      `tax_receipt_sent = true`, sends them a summary email via Resend
 *   3. Marks every included donation `tax_receipt_sent = true`
 *
 * Required env vars:
 *   - RESEND_API_KEY            Resend API key
 *   - RNHT_EMAIL_FROM           Verified from-address (e.g. "RNHT
 *                               <donations@rnht.org>"). Falls back to a
 *                               hard-coded fallback so dev doesn't crash.
 *   - SUPABASE_SERVICE_ROLE_KEY For the server-side Supabase client
 *
 * Temple info used in the letter can be overridden by env too so the admin
 * can swap the EIN / name without a redeploy.
 */

export const TAX_RECEIPT_THRESHOLD_USD = 750;

// The temple operates in Central Time (Georgetown, TX). Year bucketing and
// row-date display must both use this zone so a donation summed under one
// year's total never prints a date in the adjacent year, and so gifts in the
// first/last hours of the calendar year are bucketed by the temple's local
// year rather than UTC. Mirrors the timeZone used across the app (panchangam,
// calendar, news).
const TEMPLE_TIMEZONE = "America/Chicago";

// Current calendar year as observed in the temple timezone.
function currentTempleYear(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TEMPLE_TIMEZONE,
      year: "numeric",
    }).format(new Date()),
  );
}

// UTC instant for midnight (00:00) on `${year}-01-01` in the temple timezone.
// Computed by measuring the zone's UTC offset at that wall-clock moment, so the
// query window aligns with how created_at rows are bucketed and displayed.
function templeYearStartUtc(year: number): string {
  // Treat the wall-clock parts as if they were UTC, then correct by the zone's
  // offset at that instant (DST-aware for Jan 1, which is always standard time
  // in US Central, but computed rather than hard-coded for safety).
  const asUtc = Date.UTC(year, 0, 1, 0, 0, 0);
  const zoned = new Date(asUtc);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEMPLE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(zoned);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value);
  // What that UTC instant looks like as a wall clock in the temple zone.
  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  // offset = (interpreted-UTC) - (actual-UTC wall clock); add it back to land
  // the real instant of temple-local midnight.
  const offsetMs = wallAsUtc - asUtc;
  return new Date(asUtc - offsetMs).toISOString();
}

const TEMPLE_NAME = process.env.RNHT_TEMPLE_NAME || "Rudra Narayana Hindu Temple";
const TEMPLE_EIN = process.env.RNHT_TEMPLE_EIN || "(available upon request)";
const TEMPLE_ADDRESS =
  process.env.RNHT_TEMPLE_ADDRESS ||
  "2025 Rushing Ranch Path, Georgetown, TX 78628";
const EMAIL_FROM =
  process.env.RNHT_EMAIL_FROM || "RNHT Temple <no-reply@rnht-platform.web.app>";

type DonationRow = {
  id: string;
  amount: number;
  fund_type: string;
  created_at: string;
  tax_receipt_sent: boolean;
  donor_email: string;
  donor_name: string | null;
};

type SummaryPayload = {
  to: string;
  name: string | null;
  year: number;
  total: number;
  donations: DonationRow[];
};

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// Escape donor-controlled values before interpolating into the HTML email.
// Resend does NOT auto-escape, and donor_name / fund_type are stored raw, so an
// unescaped name like `<img src=x onerror=...>` would otherwise execute in mail
// clients that render HTML. Mirrors the esc() in supabase/functions/_shared/receipt.ts.
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function renderHtml(payload: SummaryPayload): string {
  const rows = payload.donations
    .map((d) => {
      const date = new Date(d.created_at).toLocaleDateString("en-US", {
        timeZone: TEMPLE_TIMEZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${esc(d.fund_type)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${usd(Number(d.amount))}</td>
        </tr>`;
    })
    .join("");

  return `
  <!doctype html>
  <html>
    <body style="font-family:Georgia,serif;color:#1a1a1a;background:#FEF7E1;margin:0;padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #C5973E;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#4A0818;color:#E8D5A3;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">${TEMPLE_NAME}</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">Annual Donation Summary — ${payload.year}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p>Namaste${payload.name ? " " + esc(payload.name) : ""},</p>
            <p>
              Thank you for your generous contributions to ${TEMPLE_NAME} this year.
              We are grateful for your continued support of our mission.
            </p>
            <p>
              Your cumulative tax-deductible giving has crossed
              <strong>${usd(TAX_RECEIPT_THRESHOLD_USD)}</strong>. Below is a summary
              of the donations on your account for ${payload.year}:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px;">
              <thead>
                <tr style="background:#FFF8E7;">
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #C5973E;">Date</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #C5973E;">Fund</th>
                  <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #C5973E;">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;">Total for ${payload.year}</td>
                  <td style="padding:12px;text-align:right;font-weight:bold;color:#4A0818;">${usd(payload.total)}</td>
                </tr>
              </tfoot>
            </table>
            <p style="margin-top:24px;">
              ${TEMPLE_NAME} is a 501(c)(3) nonprofit organization. All donations are
              tax-deductible to the full extent allowed by law. No goods or services
              were provided in exchange for these contributions.
            </p>
            <p style="margin-top:12px;font-size:13px;color:#555;">
              <strong>EIN:</strong> ${TEMPLE_EIN}<br/>
              <strong>Address:</strong> ${TEMPLE_ADDRESS}
            </p>
            <p style="margin-top:20px;">
              Please retain this email for your records. If you need additional
              documentation, simply reply and we'll be happy to help.
            </p>
            <p style="margin-top:24px;">
              With gratitude,<br/>
              <em>${TEMPLE_NAME}</em>
            </p>
          </td>
        </tr>
      </table>
      <p style="text-align:center;color:#7a7a7a;font-size:12px;margin-top:16px;">
        "Dharmo Rakshati Rakshitaha" &mdash; Dharma protects those who protect Dharma
      </p>
    </body>
  </html>`;
}

function renderText(payload: SummaryPayload): string {
  const rows = payload.donations
    .map((d) => {
      const date = new Date(d.created_at).toLocaleDateString("en-US", {
        timeZone: TEMPLE_TIMEZONE,
      });
      return `  ${date.padEnd(12)} ${d.fund_type.padEnd(28)} ${usd(Number(d.amount))}`;
    })
    .join("\n");

  return [
    `${TEMPLE_NAME}`,
    `Annual Donation Summary — ${payload.year}`,
    "",
    `Namaste${payload.name ? " " + payload.name : ""},`,
    "",
    `Thank you for your contributions this year. Your cumulative tax-deductible giving has crossed ${usd(TAX_RECEIPT_THRESHOLD_USD)}.`,
    "",
    "Donations:",
    rows,
    "",
    `  Total for ${payload.year}: ${usd(payload.total)}`,
    "",
    `${TEMPLE_NAME} is a 501(c)(3) nonprofit organization.`,
    `EIN: ${TEMPLE_EIN}`,
    `Address: ${TEMPLE_ADDRESS}`,
    "",
    "With gratitude,",
    TEMPLE_NAME,
  ].join("\n");
}

async function sendTaxSummaryEmail(payload: SummaryPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback: log rather than throw so local donation flows don't crash.
    // eslint-disable-next-line no-console
    console.warn(
      "[donation-receipts] RESEND_API_KEY not set — skipping summary email",
      { to: payload.to, total: payload.total, count: payload.donations.length }
    );
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: EMAIL_FROM,
    to: payload.to,
    subject: `Your ${payload.year} donation summary — ${TEMPLE_NAME}`,
    html: renderHtml(payload),
    text: renderText(payload),
  });
}

export async function checkAndSendReceipt(userId: string): Promise<void> {
  const serviceClient = getServiceSupabase();
  if (!serviceClient) return;

  const year = currentTempleYear();
  const yearStart = templeYearStartUtc(year);
  const yearEnd = templeYearStartUtc(year + 1);

  const { data: donations, error } = await serviceClient
    .from("donations")
    .select(
      "id, amount, fund_type, created_at, tax_receipt_sent, donor_email, donor_name"
    )
    .eq("user_id", userId)
    .eq("payment_status", "completed")
    .gte("created_at", yearStart)
    .lt("created_at", yearEnd)
    // Deterministic order so the recipient/salutation (rows[0]) is the most
    // recent gift's email/name, not an arbitrary row.
    .order("created_at", { ascending: false });

  if (error || !donations || donations.length === 0) return;

  const rows = donations as unknown as DonationRow[];

  // Recipient = the most recent gift's email/name (rows are ordered
  // created_at desc), preferring the donor's freshest contact details.
  const primary = rows[0];
  const primaryEmail = primary.donor_email;

  // Only the donations recorded under the address we actually email may be
  // summarized, totalled, AND marked receipted — all three must use the SAME
  // set. If this user's gifts span multiple donor_email values (email change,
  // mix of authed + guest-linked gifts), the rows under the other address(es)
  // stay out of this email and unmarked, so a future call can still deliver
  // their own summary instead of listing/charging them here or suppressing them.
  const sameEmail = rows.filter((d) => d.donor_email === primaryEmail);

  const total = sameEmail.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  if (total < TAX_RECEIPT_THRESHOLD_USD) return;

  const unsentForPrimary = sameEmail.some((d) => !d.tax_receipt_sent);
  if (!unsentForPrimary) return;

  await sendTaxSummaryEmail({
    to: primaryEmail,
    name: primary.donor_name,
    year,
    total,
    donations: sameEmail,
  });

  const ids = sameEmail.map((d) => d.id);
  await serviceClient
    .from("donations")
    .update({ tax_receipt_sent: true })
    .in("id", ids);
}
