# RNHT Security + Correctness Audit — 2026-06-14

_Multi-agent deep audit (54 agents): RLS across every table, edge-function
IDOR/auth/idempotency, secret-exposure/injection/XSS, i18n, content, completeness.
**44 adversarially-confirmed findings, 0 critical.**_

## Bottom line
**No live, presently-exploitable data breach or auth bypass.** Confirmed secure:
the `is_admin` self-grant escalation is **locked** (003 trigger + 004 WITH CHECK);
**no secrets leak to the client** (service-role/Stripe/PayPal/Resend keys only flow
into provider Authorization headers; client responses carry only URLs/IDs/booleans).
The genuine launch-gating items are **operational/correctness**, not classic
exploits. **None of the security findings are client/web-fixable** — they all need
DB migration or edge-function deploy (no Supabase CLI/token in the build env).

## ✅ Fixed + shipped to web + BUILD 18 (both platforms; gated, 752 tests)
Batch 1 (commit f478c7b):
- **Panchangam karana off-by-one** (correctness) — #1 now Kimstughna, movable cycle
  Bava-aligned, #58-60 fixed. (Devotees were shown the wrong karana.)
- **`<html lang>` syncs with selected language** (a11y/SEO) — was hardcoded "en".
- **Event times** render 12-hour ("10:00 AM - 1:00 PM") not raw 24h.
- **Punjabi `donate.subtitle`** — removed stray Kannada glyph.
- **JSON-LD `sameAs`** — added real Facebook + Instagram. **Footer copyright** added.
  **"Strotras"→"Stotras"** (priest bio). **Streaming "CST"→"CT"**.

Batch 2 (commit d19e7c5):
- **CC-02 (HIGH) /donate prerender** — wrapped in `<Suspense>` with a real
  header/skeleton fallback; verified `out/donate/index.html` now emits "Support
  Our Temple" + 501(c)(3) line instead of "Loading…". Donate logic untouched.
- **CC-01 (HIGH) deploy guard** — added `build:web` (STATIC_EXPORT) + `release`
  now asserts `out/index.html` + a `downloads/*.pdf` before `firebase deploy`.
- **Deleted dead `panchangam.server.ts`** (crash-if-called path); `@bidyashish`
  now orphaned (removable).
- **Removed gallery 404 CTA** ("View Full Gallery on Google Drive" → placeholder
  404); on-page grid is the full gallery. Dropped 3 obsolete tests.

**Build 18** (Android versionCode 18 / iOS CURRENT_PROJECT_VERSION 18) distributed:
Android via Firebase, iOS uploaded to TestFlight.

## 🔴 SECURITY — needs DB/edge-fn deploy (Supabase CLI/token required)
None are live breaches; all are integrity/abuse-hardening. One-line fixes:
- **rls-02 (HIGH)** — `bookings` has a permissive `"Anyone can create bookings"
  WITH CHECK (true)` INSERT policy that's never dropped → ORs with the owner policy
  → any anon can forge bookings under any `user_id` (spam/PII pollution; not
  confidentiality/financial). `DROP POLICY IF EXISTS "Anyone can create bookings"
  ON public.bookings;` (no shipped feature inserts bookings client-side).
- **rls-03 (MED)** — same pattern on `donations` (`"Anyone can create donations"
  WITH CHECK (true)`) → fabricated donation rows (even `payment_status=completed`)
  corrupting admin/tax views. Real money is gated by Stripe/PayPal verify, and the
  legit writer is the service-role edge fn (bypasses RLS), so `DROP POLICY IF EXISTS
  "Anyone can create donations" ON public.donations;` breaks nothing.
- **rls-04 (MED)** — apply **migration 005** (admin bookings UPDATE/DELETE — already
  authored; admin Confirm/Cancel silently no-op without it).
- **EF-03/EF-04 (LOW)** — `donate-create` is anon-key-only with wildcard CORS and no
  rate limit → can spam pending rows + real Stripe/PayPal orders. Add per-IP
  rate-limit/Turnstile + origin allowlist + `config.toml`.
- **EF-01/SEC-01 (LOW)** — Stripe verify doesn't assert `amount_total == recorded`
  (PayPal does); `_shared/receipt.ts` doesn't `esc()` fundLabel (latent, not
  exploitable today). Defense-in-depth on next edge-fn deploy.

## 🟠 Operational / SEO — remaining (flagged)
_CC-02 and CC-01 are now FIXED (see above, build 18). `profile`/`dashboard` still
have the same `useSearchParams`-without-Suspense CSR-bailout as the old donate —
apply the same `<Suspense>` wrap there next. Remaining:_
- **profile/dashboard CSR bailout** — same fix as CC-02 (wrap in `<Suspense>`).
  Lower priority (auth-gated, not crawled).
- **CC-04 (MED)** — homepage Panchangam date is seeded from `new Date()` in a
  useState initializer → build-time date baked into static HTML → hydration
  reconcile + stale-date flash for later-day visitors. Fix: init to null/placeholder,
  set the real date in `useEffect` (mirror HomeTempleCalendar's #425 mitigation).
- **rls-01 (HIGH, file-only)** — the `supabase/migrations/` folder is divergent from
  the root `migration-00X-*.sql` set the live DB was built from; a `db reset` from
  migrations/ aborts in 002 and yields a schema with no owner RLS + no is_admin lock.
  Fix: fold root migration-001 into migrations/001, delete the root duplicates,
  validate with `db reset` against a **scratch** project (never the live ref).
- **CC-03 (MED)** — Firebase `**`→`/index.html` catch-all makes 404.html unreachable
  (soft-404, dupe homepage indexed). Remove the catch-all (trailingSlash already
  emits per-route index.html). Needs `firebase deploy --only hosting`.

## 🟡 i18n / content / product decisions
- **i18n-01 (HIGH)** — dashboard/profile/login + the whole homepage hardcode English;
  only Header/donate/services call `t()`. Needs a code-wiring pass **and** human
  translation (×10 locales) — large; stage deliberately.
- **masa-static-month-table / karana** — masa from a fixed Gregorian-month lookup is
  wrong for ~half of each month (the adhika override is applied to all of June). Port
  the purnima-nakshatra derivation to the client for accuracy.
- **stale-festival-event-dates** — hardcoded 2026 festival/annadanam dates are in the
  past → calendar shows no upcoming festivals; sponsorship/community advertise past
  dates as upcoming. Needs the real schedule (or drive from the live events table).
- **CC-08** — Education/Community pages show fabricated instructor names + 2025 stats
  as real data. Replace with real content or remove the pages.
- **orphan routes** — community/education/sponsorship/streaming/transparency (and
  effectively /news, /calendar via never-imported home components) are in the sitemap
  but unreachable. Decide: surface in nav/footer or remove from sitemap.
- **gallery "View Full Gallery"** → placeholder `photos.app.goo.gl/rnht` (404),
  mislabeled "Google Drive". Needs the real album URL or remove the CTA.
- **panchangam dead code** — `panchangam.server.ts` + `@bidyashish/panchang` are
  unused (the "accurate" path would crash if called); delete to remove the landmine.
- Minor: shloka grammar, terms last-updated date, PWA icons (192/512), /contact
  Support-URL auto-redirect, sponsorship savings copy.

## ✅ Verified secure (no action)
is_admin lock (rls-07); secrets not leaked (EF-08); owner/admin-scoped PII SELECT;
public-read content tables intentional; delete-account self-verifies; PayPal capture
cross-checks amount + ownership + idempotent.
