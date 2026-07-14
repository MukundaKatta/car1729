// Whether the donor-facing year-end tax acknowledgment can be issued for a
// given tax year. Encodes the temple CPA's rules (2026-07-14):
//   1. The written acknowledgment is issued in JANUARY of the following year —
//      i.e. only once the tax year is complete (year < current tax year).
//   2. It is issued only when annual giving totals $250 or more.
// Individual donation receipts remain available for any amount; this gate is
// specifically the aggregate year-end acknowledgment letter.

/** IRS threshold for a written contemporaneous acknowledgment. */
export const ACK_MIN_ANNUAL_TOTAL = 250;

export type ReceiptEligibility =
  | { ok: true }
  | { ok: false; reason: "not_yet" | "below_threshold"; message: string };

export function yearEndReceiptEligibility(args: {
  /** The tax year the acknowledgment would cover. */
  year: number;
  /** The current tax year (temple timezone). NaN is treated as "unknown". */
  currentYear: number;
  /** The donor's total completed giving for `year`. */
  yearTotal: number;
  /** Currency formatter, injected so this stays framework-free. */
  formatCurrency: (n: number) => string;
}): ReceiptEligibility {
  const { year, currentYear, yearTotal, formatCurrency } = args;

  // The tax year must be complete: the acknowledgment for year Y is issued from
  // January of Y+1. During the current (or a future) year it isn't available.
  if (Number.isFinite(currentYear) && year >= currentYear) {
    return {
      ok: false,
      reason: "not_yet",
      message:
        `Your ${year} year-end tax acknowledgment will be available in January ${year + 1}, ` +
        `once the tax year is complete. Your individual donation receipts serve as your ` +
        `records in the meantime.`,
    };
  }

  if (yearTotal < ACK_MIN_ANNUAL_TOTAL) {
    return {
      ok: false,
      reason: "below_threshold",
      message:
        `A formal year-end acknowledgment is issued for annual giving of $250 or more. ` +
        `Your ${year} total is ${formatCurrency(yearTotal)} — please keep your individual ` +
        `donation receipts as your records.`,
    };
  }

  return { ok: true };
}
