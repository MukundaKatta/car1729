// Human-readable names for each donation fund slug.
// Kept in sync with src/app/api/donate/route.ts (the Next.js version we're
// porting from). Both the Edge Function and the verification step reach
// for this map, so update both in one place.
export const fundLabels: Record<string, string> = {
  general: "General Temple Fund",
  building: "Building Fund",
  priest: "Priest Fund",
  annadanam: "Annadanam Fund",
  festival: "Festival Fund",
  education: "Education Fund",
  "rudra-narayana": "Sri Rudra Narayana Seva",
  ganesha: "Lord Ganesha Seva",
  lakshmi: "Goddess Lakshmi Seva",
  hanuman: "Lord Hanuman Seva",
  shiva: "Lord Shiva Seva",
  rama: "Lord Rama Seva",
};
