/**
 * Automated year-end consolidated tax receipts.
 *
 * Run once each January (GitHub Actions cron) for the calendar year that just
 * closed. For every donor whose completed giving totalled >= $250, it emails a
 * single consolidated "Year-End Charitable Donation Acknowledgment" PDF (the
 * same branded generator the app uses), keyed/deduped by normalized email so a
 * devotee's account + guest gifts consolidate into one statement. Idempotent via
 * the public.year_end_receipts ledger — a re-run never double-mails a donor.
 *
 * SAFETY: dry-run by DEFAULT. It only sends when `--send` (or SEND_FOR_REAL=true)
 * is passed, so an accidental manual run can't blast emails. The scheduled job
 * passes `--send`.
 *
 * Usage:
 *   tsx scripts/send-year-end-receipts.ts [--year=2026] [--send] [--force] [--limit=N]
 *     --year   tax year to process (default: previous temple-timezone year)
 *     --send   actually send + record (omit for a dry run)
 *     --force  ignore the ledger (re-send even if already recorded) — testing only
 *     --limit  cap the number of donors processed (testing)
 *
 * Env (GitHub repo secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — DB access (service role)
 *   RESEND_API_KEY                            — email delivery
 *   RECEIPT_FROM                              — verified sender, e.g.
 *                                               "Rudra Narayana Hindu Temple <receipts@rnht.org>"
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildYearEndReceiptArtifacts } from "@/lib/tax-receipt-pdf";
import { formatCurrency } from "@/lib/utils";
import { prettyFund } from "@/lib/fund";
import {
  currentTempleYear,
  templeYearWindow,
  groupDonationsByDonor,
  eligibleDonors,
  toReceiptDonation,
  TEMPLE_TIMEZONE,
  type DbDonation,
  type DonorProfile,
  type DonorGroup,
} from "@/lib/year-end-batch";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf("=");
  return eq === -1 ? "true" : hit.slice(eq + 1);
}

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM =
    process.env.RECEIPT_FROM ||
    "Rudra Narayana Hindu Temple <receipts@rnht.org>";
  if (!SUPABASE_URL || !SERVICE_KEY) fail("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const send = arg("send") === "true" || process.env.SEND_FOR_REAL === "true";
  const force = arg("force") === "true";
  const limit = arg("limit") ? Number(arg("limit")) : undefined;
  const year = arg("year") ? Number(arg("year")) : currentTempleYear() - 1;
  if (!Number.isInteger(year)) fail(`invalid --year: ${arg("year")}`);

  console.log(
    `⚙️  Year-end receipts | tax year ${year} | ${send ? "SEND" : "DRY-RUN"}` +
      `${force ? " | FORCE" : ""}${limit ? ` | limit ${limit}` : ""} | tz ${TEMPLE_TIMEZONE}`,
  );

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 1) Completed donations in the temple-local calendar year.
  const { startUtc, endUtc } = templeYearWindow(year);
  const { data: rows, error: donErr } = await supabase
    .from("donations")
    .select("id,user_id,donor_name,donor_email,amount,fund_type,payment_method,is_recurring,created_at,custom_fields")
    .eq("payment_status", "completed")
    .gte("created_at", startUtc)
    .lt("created_at", endUtc);
  if (donErr) fail(`donations query failed: ${donErr.message}`);
  const donations = (rows ?? []) as DbDonation[];
  console.log(`   fetched ${donations.length} completed donations in ${year}`);

  // 2) Profiles (name/address) for the donor emails, for the letter.
  const emails = Array.from(
    new Set(donations.map((d) => (d.donor_email ?? "").trim().toLowerCase()).filter(Boolean)),
  );
  const profilesByEmail = new Map<string, DonorProfile>();
  if (emails.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("email,name,address,city,state,zip")
      .in("email", emails);
    for (const p of profs ?? []) {
      profilesByEmail.set((p.email ?? "").trim().toLowerCase(), p as DonorProfile);
    }
  }

  // 3) Group + apply the $250 / year-complete eligibility rules.
  const groups = groupDonationsByDonor(donations, profilesByEmail);
  const { eligible, skippedBelowThreshold, notYet } = eligibleDonors(groups, year, currentTempleYear());
  if (notYet) fail(`tax year ${year} is not complete yet — acknowledgments are issued in January of ${year + 1}`);
  console.log(`   ${groups.length} donors | ${eligible.length} eligible (>=$250) | ${skippedBelowThreshold.length} below threshold`);

  // 4) Idempotency: who already has a ${year} statement.
  const { data: already, error: ledErr } = await supabase
    .from("year_end_receipts")
    .select("donor_email")
    .eq("tax_year", year);
  if (ledErr) fail(`ledger query failed: ${ledErr.message}`);
  const sentAlready = new Set((already ?? []).map((r) => (r.donor_email ?? "").trim().toLowerCase()));

  let todo = eligible.filter((g) => force || !sentAlready.has(g.email));
  const skippedAlready = eligible.length - todo.length;
  if (limit) todo = todo.slice(0, limit);

  const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
  if (send && !resend) fail("--send given but RESEND_API_KEY is not set");

  let sent = 0;
  const failures: { email: string; error: string }[] = [];

  for (const g of todo) {
    try {
      const artifacts = buildYearEndReceiptArtifacts({
        donorName: g.name,
        donorEmail: g.email,
        donorAddress: g.address,
        year,
        donations: g.donations.map(toReceiptDonation),
      });
      const line = `   • ${g.email}  ${g.donations.length} gift(s)  ${formatCurrency(g.total)}`;
      if (!send) {
        console.log(`${line}  [dry-run]`);
        continue;
      }
      const { html, text, subject } = renderEmail(g, year);
      const res = await resend!.emails.send({
        from: FROM,
        to: g.email,
        subject,
        html,
        text,
        attachments: [{ filename: artifacts.filename, content: artifacts.base64 }],
      });
      if (res.error) throw new Error(res.error.message ?? String(res.error));
      // Record AFTER a successful send (send-first, so a delivery failure never
      // marks a donor "done" and silently skips them next run). Upsert on the
      // UNIQUE(donor_email, tax_year) key so a --force re-send UPDATES the row
      // (fresh message_id + sent_at) instead of erroring after the email went
      // out; the tiny crash-after-send window could re-send once next January,
      // harmless for a tax acknowledgment.
      const { error: insErr } = await supabase.from("year_end_receipts").upsert(
        {
          donor_email: g.email,
          tax_year: year,
          donation_count: g.donations.length,
          total_amount: g.total,
          message_id: res.data?.id ?? null,
          sent_at: new Date().toISOString(),
        },
        { onConflict: "donor_email,tax_year" },
      );
      if (insErr) console.error(`   ⚠️ sent to ${g.email} but ledger insert failed: ${insErr.message}`);
      console.log(`${line}  ✓ sent (${res.data?.id ?? "no-id"})`);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push({ email: g.email, error: msg });
      console.error(`   ✗ ${g.email}: ${msg}`);
    }
  }

  console.log(
    `\n✅ Done. tax year ${year} | eligible ${eligible.length} | ${send ? "sent" : "would send"} ${send ? sent : todo.length}` +
      ` | already-sent skipped ${skippedAlready} | below-threshold ${skippedBelowThreshold.length} | failed ${failures.length}`,
  );
  if (!send) console.log("   (dry run — nothing emailed or recorded; pass --send to deliver)");
  if (failures.length) process.exit(1);
}

function renderEmail(g: DonorGroup, year: number): { html: string; text: string; subject: string } {
  const esc = (s: string) =>
    (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { timeZone: TEMPLE_TIMEZONE, month: "short", day: "numeric", year: "numeric" });
  const rows = g.donations
    .map(
      (d) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${fmtDate(d.created_at)}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(prettyFund(d.fund_type))}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(Number(d.amount))}</td></tr>`,
    )
    .join("");
  const subject = `Your ${year} Year-End Tax Acknowledgment — Rudra Narayana Hindu Temple`;
  const html = `<div style="font-family:Georgia,serif;color:#1a1a1a;max-width:600px;margin:0 auto">
    <h2 style="color:#4A0818">Year-End Charitable Donation Acknowledgment — ${year}</h2>
    <p>Namaste ${esc(g.name)},</p>
    <p>Thank you for your generous support of Rudra Narayana Hindu Temple during ${year}.
    Your official consolidated tax acknowledgment for the year is <strong>attached as a PDF</strong>
    for your records. A summary is below.</p>
    <table style="border-collapse:collapse;width:100%;margin:12px 0">
      <thead><tr style="background:#FFF8E7">
        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #C5973E">Date</th>
        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #C5973E">Fund</th>
        <th style="padding:6px 10px;text-align:right;border-bottom:1px solid #C5973E">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="2" style="padding:10px;text-align:right;font-weight:bold">Total for ${year}</td>
        <td style="padding:10px;text-align:right;font-weight:bold;color:#4A0818">${formatCurrency(g.total)}</td>
      </tr></tfoot>
    </table>
    <p style="font-size:13px;color:#555">Rudra Narayana Hindu Temple is a 501(c)(3) nonprofit. No goods or services
    were provided in exchange for these contributions, other than intangible religious benefits. Please retain the
    attached acknowledgment for your tax records.</p>
    <p>With gratitude,<br/><em>Rudra Narayana Hindu Temple</em></p>
  </div>`;
  const text =
    `Year-End Charitable Donation Acknowledgment — ${year}\n\nNamaste ${g.name},\n\n` +
    `Thank you for your support of Rudra Narayana Hindu Temple during ${year}. Your official consolidated ` +
    `tax acknowledgment is attached as a PDF.\n\n` +
    g.donations.map((d) => `  ${fmtDate(d.created_at)}  ${prettyFund(d.fund_type)}  ${formatCurrency(Number(d.amount))}`).join("\n") +
    `\n  Total for ${year}: ${formatCurrency(g.total)}\n\n` +
    `RNHT is a 501(c)(3) nonprofit. Please retain the attached acknowledgment for your records.`;
  return { html, text, subject };
}

main().catch((e) => fail(e instanceof Error ? e.stack ?? e.message : String(e)));
