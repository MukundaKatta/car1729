// Per-service registration Google Forms.
//
// Paste each service's Google Form URL below, keyed by the service `slug`
// (the slugs match src/lib/sample-data.ts / the Supabase `services` table).
// The "Register" button on a service card appears as soon as that service has
// a non-empty URL here — services left blank simply won't show the button yet,
// so there are never any dead links.
//
// Optional: set GENERAL_REGISTRATION_FORM to a single fallback form URL and
// EVERY service immediately shows a Register button pointing at it, until a
// service-specific form is filled in above (the specific one then wins).

export const GENERAL_REGISTRATION_FORM = "";

export const REGISTRATION_FORMS: Record<string, string> = {
  "udaka-shanthi-puja": "",
  "devi-saptashati-parayanam": "",
  "sundarakanda-path-parayanam": "",
  "anna-shraddham": "",
  "hiranya-shraddham": "",
  "shiva-parvati-kalyanam": "",
  "mahanyasa-purvaka-ekadasa-rudrabhishekam": "",
  "sri-seeta-rama-kalyanam": "",
  "srinivasa-kalyanam": "",
  "pumsavanam": "",
  "seemantam": "",
  "jatakarma": "",
  "annaprasana": "",
  "upanayanam-jeneau": "",
  "vivaham-wedding": "",
  "keshakhandana-mundan": "",
  "aksharabhyasam-vidyarambham": "",
  "maha-lingarchana": "",
  "chandi-homam": "",
  "surya-yantra-namaskara-puja": "",
  "laghunyasa-ekavaara-rudrabhishekam": "",
  "namakaran-naming-ceremony": "",
  "satyanarayana-katha": "",
  "snatakam-kaasiyattra": "",
  "satyanarayana-vratam": "",
  "balarista-dosha-nivarana": "",
  "kuja-dosha-nivarana": "",
  "nakshatra-shanthi-homa": "",
  "bhoomi-pooja-ground-breaking": "",
  "laksha-varti-vratam": "",
  "sahasra-chandra-darshanam": "",
  "bheemaratha-shanti": "",
  "punyahavachanam": "",
  "shastipoorti": "",
  "gruhapravesham-puja": "",
  "ganapathi-puja": "",
};

/**
 * Returns the registration form URL for a service slug, or "" if none is set.
 * Prefers the service-specific form, then the general fallback.
 */
export function getRegistrationUrl(slug: string | undefined | null): string {
  const specific = (slug && REGISTRATION_FORMS[slug]) || "";
  return specific.trim() || GENERAL_REGISTRATION_FORM.trim() || "";
}
