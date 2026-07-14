// Donations store the fund as a lowercase slug (e.g. "general"). Displaying that
// raw slug reads unpolished — on the 501(c)(3) tax-receipt PDF and in the
// dashboard activity feed. Map the known slugs to their canonical display names
// and Title-Case anything else.
//
// IMPORTANT: this map MUST mirror supabase/functions/_shared/fund-labels.ts,
// which is the source of truth the donate edge function + the emailed receipt
// use. If the two diverge, the downloadable tax-receipt PDF and the emailed
// receipt show different Donation Type labels for the same gift. Keep in sync.
export const FUND_LABELS: Record<string, string> = {
  general: "General Temple Donation",
  building: "Building Donation",
  priest: "Priest Donation",
  annadanam: "Annadanam Donation",
  festival: "Festival Donation",
  education: "Education Donation",
  "rudra-narayana": "Sri Rudra Narayana Seva",
  ganesha: "Lord Ganesha Seva",
  lakshmi: "Goddess Lakshmi Seva",
  hanuman: "Lord Hanuman Seva",
  shiva: "Lord Shiva Seva",
  rama: "Lord Rama Seva",
};

/**
 * Standard funds always offered in the admin Manual Donation Receipt form (in
 * display order), so the donation-type dropdown works even before any
 * admin-managed donation_types exist. Merged with the active donation_types at
 * render time; both are accepted by the record-manual-donation edge function's
 * fund allowlist. "General Temple Donation" and "Festival Donation" lead per the
 * client's spec.
 */
export const STANDARD_FUNDS: { slug: string; name: string }[] = [
  { slug: "general", name: FUND_LABELS.general },
  { slug: "festival", name: FUND_LABELS.festival },
  { slug: "annadanam", name: FUND_LABELS.annadanam },
  { slug: "building", name: FUND_LABELS.building },
];

export function prettyFund(fund: string): string {
  const key = (fund || "").trim().toLowerCase();
  if (FUND_LABELS[key]) return FUND_LABELS[key];
  const titled = (fund || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return titled || "General Temple Donation";
}
