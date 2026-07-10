// Donations store the fund as a lowercase slug (e.g. "general"). Displaying that
// raw slug reads unpolished — on the 501(c)(3) tax-receipt PDF and in the
// dashboard activity feed. Map the known slugs to their donate-page display
// names and Title-Case anything else. Shared by tax-receipt-pdf.ts and the
// devotee dashboard so the label is consistent everywhere.
const FUND_LABELS: Record<string, string> = {
  general: "General Temple Donation",
  festival: "Festival Donation",
};

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
