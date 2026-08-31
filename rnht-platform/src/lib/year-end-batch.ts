// Pure aggregation logic for the automated year-end consolidated tax receipts.
//
// The runner (scripts/send-year-end-receipts.ts, on a GitHub Actions cron each
// January) fetches the year's completed donations and profiles, then uses these
// helpers to decide WHO gets a consolidated "Year-End Charitable Donation
// Acknowledgment" and WHAT goes in it. Kept framework-free and side-effect-free
// so it is unit-testable without a DB or network.
//
// Rules (temple CPA, see tax-receipt-eligibility.ts):
//   * One statement per donor, keyed by NORMALIZED email — so a devotee's
//     account gifts and any guest gifts under the same address consolidate.
//   * Only completed gifts in the calendar year (temple timezone).
//   * Only donors whose annual total is >= $250 (ACK_MIN_ANNUAL_TOTAL).

import type { Donation } from "@/store/auth";
import {
  ACK_MIN_ANNUAL_TOTAL,
  yearEndReceiptEligibility,
} from "@/lib/tax-receipt-eligibility";
import { formatCurrency } from "@/lib/utils";

// Georgetown, TX. Year bucketing must match how the rest of the app buckets
// created_at (panchangam/calendar/receipts) so a gift in the first/last hours of
// the year lands in the temple's local year, not UTC's.
export const TEMPLE_TIMEZONE = "America/Chicago";

/** Current calendar year as observed in the temple timezone. */
export function currentTempleYear(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TEMPLE_TIMEZONE,
      year: "numeric",
    }).format(now),
  );
}

/** UTC instant of midnight (00:00) on `${year}-01-01` in the temple timezone. */
export function templeYearStartUtc(year: number): string {
  const asUtc = Date.UTC(year, 0, 1, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEMPLE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(asUtc));
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value);
  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  const offsetMs = wallAsUtc - asUtc;
  return new Date(asUtc - offsetMs).toISOString();
}

/** [start, end) UTC ISO window covering the temple-local calendar `year`. */
export function templeYearWindow(year: number): { startUtc: string; endUtc: string } {
  return { startUtc: templeYearStartUtc(year), endUtc: templeYearStartUtc(year + 1) };
}

/** The donations columns the batch needs (a subset of the DB row). */
export type DbDonation = {
  id: string;
  user_id: string | null;
  donor_name: string | null;
  donor_email: string;
  amount: number | string;
  fund_type: string;
  payment_method?: string | null;
  is_recurring?: boolean | null;
  created_at: string;
};

/** A donor's mailing address, when known (from their profile). */
export type DonorProfile = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export type DonorGroup = {
  /** Normalized (lower/trimmed) email — the grouping + idempotency key. */
  email: string;
  /** Best display name: freshest profile name, else freshest donation name. */
  name: string;
  /** One-line mailing address, when resolvable from the profile. */
  address?: string;
  donations: DbDonation[];
  total: number;
};

export function normalizeEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

function oneLineAddress(p?: DonorProfile): string | undefined {
  if (!p) return undefined;
  const parts = [p.address, [p.city, p.state].filter(Boolean).join(", "), p.zip]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/**
 * Group completed donation rows into one entry per donor (by normalized email),
 * summing the total and choosing the freshest name/address. `profilesByEmail`
 * (optional) supplies the account's name/mailing address for the letter.
 * Donations must already be filtered to completed + in-year; ordering is not
 * assumed (we sort by created_at internally).
 */
export function groupDonationsByDonor(
  rows: DbDonation[],
  profilesByEmail: Map<string, DonorProfile> = new Map(),
): DonorGroup[] {
  const byEmail = new Map<string, DbDonation[]>();
  rows.forEach((r) => {
    const key = normalizeEmail(r.donor_email);
    if (!key) return; // never group gifts with no email together under ""
    const arr = byEmail.get(key);
    if (arr) arr.push(r);
    else byEmail.set(key, [r]);
  });

  const groups: DonorGroup[] = [];
  byEmail.forEach((ds, email) => {
    // Freshest gift first, so name/salutation uses the donor's latest details.
    ds.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const profile = profilesByEmail.get(email);
    const total =
      Math.round(ds.reduce((s, d) => s + Number(d.amount ?? 0), 0) * 100) / 100;
    const name =
      (profile?.name && profile.name.trim()) ||
      (ds[0].donor_name && ds[0].donor_name.trim()) ||
      "Devotee";
    groups.push({ email, name, address: oneLineAddress(profile), donations: ds, total });
  });
  // Deterministic output order (by email) for stable logs/tests.
  groups.sort((a, b) => (a.email < b.email ? -1 : 1));
  return groups;
}

/**
 * Keep only donor groups eligible for a formal year-end acknowledgment: the tax
 * year is complete and the annual total is >= $250. Returns the eligible groups
 * plus the excluded ones (with a reason) for reporting.
 */
export function eligibleDonors(
  groups: DonorGroup[],
  year: number,
  currentYear: number,
): { eligible: DonorGroup[]; skippedBelowThreshold: DonorGroup[]; notYet: boolean } {
  const elig = yearEndReceiptEligibility({
    year,
    currentYear,
    yearTotal: Number.POSITIVE_INFINITY, // probe the "not_yet" gate only
    formatCurrency,
  });
  if (!elig.ok && elig.reason === "not_yet") {
    return { eligible: [], skippedBelowThreshold: [], notYet: true };
  }
  const eligible: DonorGroup[] = [];
  const skippedBelowThreshold: DonorGroup[] = [];
  for (const g of groups) {
    if (g.total >= ACK_MIN_ANNUAL_TOTAL) eligible.push(g);
    else skippedBelowThreshold.push(g);
  }
  return { eligible, skippedBelowThreshold, notYet: false };
}

/** Derive the "REC-XXXXXXXX" receipt number the letter shows for a gift. */
export function receiptNumber(donationId: string): string {
  return "REC-" + donationId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Map a DB donation to the `Donation` shape the PDF generator consumes. */
export function toReceiptDonation(d: DbDonation): Donation {
  return {
    id: d.id,
    fund: d.fund_type,
    amount: Number(d.amount ?? 0),
    date: d.created_at,
    method: d.payment_method ?? "",
    recurring: Boolean(d.is_recurring),
    receiptId: receiptNumber(d.id),
    taxDeductible: true,
    status: "completed",
  };
}
