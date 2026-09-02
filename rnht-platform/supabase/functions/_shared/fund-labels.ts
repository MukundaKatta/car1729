// Human-readable names for each donation fund slug.
// Legacy fund labels: the admin-managed donation_types table takes precedence
// and this map is the fallback. Every edge function that names a fund on a
// receipt reaches for it, so update it in one place.
export const fundLabels: Record<string, string> = {
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
