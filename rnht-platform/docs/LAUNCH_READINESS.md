# RNHT Launch Readiness

_Last updated: 2026-06-14. Status of the app vs. App Store / Play Store submission._

## ✅ Done & verified (engineering)

- **5 multi-agent audits + ~70 fixes** this cycle (criticals → polish), each gated
  with `tsc` + the full test suite (now **752 tests**) + lint + `next build`.
- **Live runtime QA** (web, real-browser): home, services + detail modal, calendar
  (list + month grid), donate, login, community, news + article, panchangam, gallery
  + lightbox — all healthy with strong keyboard a11y; panchangam computes the live
  date correctly (Adhik Jyeshtha Masa override confirmed in prod).
- **Calendar recurring events** now show a cadence ("Every Saturday",
  "Monthly · 4th Sunday", "Monthly · Purnima (full moon)") instead of a first-
  occurrence date that goes stale; lunar/tithi rules are named, not guessed.
- **Web** live on Firebase Hosting; all 23 routes return 200.
- **Supabase edge functions** (`donate`, `paypal-capture`, `delete-account`) live;
  input validation verified against production (invalid fund / bad email / over-cap
  all rejected with 400, no rows written).
- **Database integrity** (live): `is_admin` immutability trigger present, `profiles`
  UPDATE policy has `WITH CHECK`, every public table has RLS, 6 active funds.
- Security highlights closed: privilege-escalation lock, in-app account deletion
  reachable (Apple 5.1.1(v)), tax-receipt XSS escaping, native payment reconcile,
  fund-type allowlist.
- **Native audit + build 16 (2026-06-14)** — a multi-agent native launch-readiness
  audit (23 confirmed findings) caught **two real blockers**, both fixed and
  **runtime-validated on the iOS Simulator + Android emulator**:
  - **Supabase env was not baked into the mobile bundle** → auth + donations were
    dead on device. `build-mobile.sh` now loads `.env.local` and **fails fast** if
    the `NEXT_PUBLIC_SUPABASE_*` vars are missing, so an env-less native build can
    never ship again. Validated on device: dashboard loads real data ("Namaste,
    Mukunda!", $11 Total Donated), donate opens Stripe checkout, login is live.
  - **Android app name was "My App"** (Capacitor template default) → set to
    "RNHT Temple" (APK manifest verified); stale `com.getcapacitor.myapp`
    package/scheme corrected to `org.rnht.app`.
  - Also: Android hardware **back button now closes user-facing modals**
    (education/community/profile); dropped obsolete iOS `armv7` capability; removed
    a latent `'use server'` action. Build bumped to **16** (Android versionCode 16,
    iOS CURRENT_PROJECT_VERSION 16). **Not yet distributed** — see below.

## 🔴 Blockers that need YOU (not engineering bugs)

1. **Live Stripe key** — the app is still in Stripe **test** mode. A real donor
   would hit a sandbox checkout, so the donation app cannot be submitted/launched
   until this is swapped. Steps:
   - In Supabase → Project → Edge Functions → Secrets, set
     `STRIPE_SECRET_KEY=sk_live_…` (replacing the current `sk_test_…`).
   - Redeploy: `supabase functions deploy donate` (and `paypal-capture` if PayPal
     goes live — also set `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` / `PAYPAL_MODE=live`).
   - For receipt emails set `RESEND_API_KEY` + `RNHT_EMAIL_FROM` (verified domain).
2. **Translations** for the Dashboard / Profile / Login screens (10 languages).
   These currently fall back to English. They need a human translator (not machine
   guesses for temple/devotional terms). Ask the assistant to generate a fill-in
   template of the exact strings when you have a translator ready.
3. **Festival / annadanam dates** — a few are still hardcoded for 2026; provide the
   real schedule (or a small DB table) to make them dynamic.

## 🟡 In Apple's hands

- **Beta is live on both platforms — build 17** (Android via Firebase App
  Distribution to the 4 testers; iOS uploaded to TestFlight → internal testers
  after Apple processing). Build 16 → 17 added: native Supabase env fix, Android
  app name, calendar cadence, Android back-button, admin error-handling,
  family-member edit.
- iOS **external** testers are still gated: build 13 is in Apple **Beta App
  Review**, and only one build can be in review at a time. Cancel build 13 in
  App Store Connect → TestFlight, then submit build 17 for external testing.

## 🧹 Test-data cleanup (review, then run with the service role)

Bogus rows created during QA still sit in the live `donations` table. Review and
run when ready (these are NOT real donations):

```sql
-- The malformed injection-test row (fund_type allowlist now blocks new ones)
DELETE FROM donations WHERE fund_type = 'INVALID_FUND_TYPE' AND donor_email = 'test@test.com';
-- QA test donations under the dev account (keep none of these for accounting)
DELETE FROM donations
WHERE donor_email = 'mukunda.vjcs6@gmail.com'
  AND amount IN (1.00, 11.00, 25.00);
-- Verify afterward:
-- SELECT amount, fund_type, payment_status, donor_email FROM donations ORDER BY created_at DESC;
```

## 🟠 Native follow-ups (from the 2026-06-14 audit — not blockers)

The native architecture is otherwise sound (audit confirmed Google correctly
hidden on native, opt-in music, double-submit guard, session persistence). Worth
doing, in priority order:

1. **Payment return + settlement hardening (H1 + M1 + M2).** After paying, the
   Stripe/PayPal success page loads inside the in-app browser and only reconciles
   when the donor manually closes it (no deep link). Robust fix = Stripe/PayPal
   **webhooks** (server-side source of truth) + a tiny auto-closing return page +
   an `App` resume listener that persists the pending donation id. **Needs a real
   device to confirm** in-app-browser close timing. Recoverable today (an amber
   banner tells donors to return), so not blocking.
2. **Verify the Supabase email template emits `{{ .Token }}`** (Auth → Email
   Templates → Magic Link) — the native in-app email-code sign-in depends on it.
   Can't be checked from the repo; verify in the dashboard before launch.
3. **Admin modals back button** (booking/event/slideshow) — internal tooling;
   apply the same `pushOverlay` registration the user-facing modals now have.
4. Polish: Android status-bar/header color seam; profile Add-Family modal keyboard
   overflow on small phones; relabel calendar "Download" → "View".

## ℹ️ Available on request

- **Build 16** is built + runtime-verified on simulator/emulator but **not yet
  distributed**. It carries everything above plus the web-only fixes (donate
  verify-error clearing, admin approval action types, news-skeleton CLS, calendar
  recurrence cadence). Say the word to archive + upload iOS to TestFlight and
  distribute the Android AAB — note iOS external testing is still gated on build 13
  clearing Beta App Review, and an App Store *submission* still needs the live
  Stripe key.

## Standard deploy (engineering reference)

`npm ci` → `npm run test:run` → `npm run build` → `git push origin main`
(CI deploys Firebase) → smoke-test routes.
