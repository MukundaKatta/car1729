// Guard a URL that comes from the database (admin-entered priest WhatsApp links,
// volunteer group links, etc.) before it is placed into an <a href>. Without
// this, an admin-set value like `javascript:alert(1)` would execute when a
// public visitor clicks the link (stored XSS). We allow only the schemes the
// app actually uses, plus site-relative URLs. Anything else (javascript:,
// data:, vbscript:, unknown schemes) is rejected -> the caller renders no link.
const ALLOWED_SCHEMES = ["http:", "https:", "tel:", "mailto:"];

export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  // Site-relative / anchor / protocol-relative links are safe.
  if (/^(\/|#|\.\/|\.\.\/)/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  try {
    const scheme = new URL(trimmed).protocol.toLowerCase();
    return ALLOWED_SCHEMES.includes(scheme) ? trimmed : undefined;
  } catch {
    // No parseable scheme (e.g. "wa.me/123", "example.com/x") — treat as https.
    return `https://${trimmed}`;
  }
}
