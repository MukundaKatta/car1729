// Helpers for calling Supabase Edge Functions from the static-export
// client. Because we deploy as a static site to Firebase Hosting, the
// Next.js /api/* routes are not reachable — donate / checkout / webhook
// handlers live as Edge Functions in supabase/functions/* instead.
//
// `NEXT_PUBLIC_SUPABASE_URL` is the project URL (e.g.
// https://<ref>.supabase.co). Functions are exposed under
// `<projectUrl>/functions/v1/<function-name>`.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function functionUrl(name: string): string {
  if (!SUPABASE_URL) {
    // Fall back to the Next.js /api/* path for local `next dev` /
    // Vercel deploys where API routes are live.
    return `/api/${name === "paypal-capture" ? "webhooks/paypal" : name}`;
  }
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${name}`;
}

/** Headers required by Supabase Edge Functions (anon key for non-authed calls). */
export function edgeFunctionHeaders(extra?: HeadersInit): HeadersInit {
  const base: Record<string, string> = {};
  if (SUPABASE_ANON_KEY && SUPABASE_URL) {
    base["apikey"] = SUPABASE_ANON_KEY;
    base["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  if (extra) {
    return { ...base, ...(extra as Record<string, string>) };
  }
  return base;
}

/** POST /functions/v1/donate — create Stripe Checkout session or PayPal order. */
export const donateCreateUrl = (): string => functionUrl("donate");

/** GET /functions/v1/donate?session_id=... — verify Stripe completion. */
export const donateVerifyUrl = (sessionId: string): string =>
  `${functionUrl("donate")}?session_id=${encodeURIComponent(sessionId)}`;

/** POST /functions/v1/paypal-capture — capture an approved PayPal order. */
export const paypalCaptureUrl = (): string => functionUrl("paypal-capture");
