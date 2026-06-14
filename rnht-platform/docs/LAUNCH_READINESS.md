# RNHT Launch Readiness

_Last updated: 2026-06-13. Status of the app vs. App Store / Play Store submission._

## ✅ Done & verified (engineering)

- **5 multi-agent audits + ~70 fixes** this cycle (criticals → polish), each gated
  with `tsc` + the full test suite (now **735+ tests**) + lint + `next build`.
- **Web** live on Firebase Hosting; all 23 routes return 200.
- **Supabase edge functions** (`donate`, `paypal-capture`, `delete-account`) live;
  input validation verified against production (invalid fund / bad email / over-cap
  all rejected with 400, no rows written).
- **Database integrity** (live): `is_admin` immutability trigger present, `profiles`
  UPDATE policy has `WITH CHECK`, every public table has RLS, 6 active funds.
- **Native**: Android build 14 distributed (Firebase App Distribution); iOS build 14
  on TestFlight (internal testers live).
- Security highlights closed: privilege-escalation lock, in-app account deletion
  reachable (Apple 5.1.1(v)), tax-receipt XSS escaping, native payment reconcile,
  fund-type allowlist.

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

- iOS **external** testers: build 13 is in Apple **Beta App Review**. Once it
  clears (or you cancel its submission in App Store Connect → TestFlight), build 14
  can be submitted for external testing.

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

## ℹ️ Available on request

- **Build 15** — 6 minor web-only fixes (donate verify-error clearing, admin
  approval action types, news-skeleton CLS) are live on web but predate native
  build 14. Say the word to roll a build 15 + redistribute, or let them fold into
  the next planned native build.

## Standard deploy (engineering reference)

`npm ci` → `npm run test:run` → `npm run build` → `git push origin main`
(CI deploys Firebase) → smoke-test routes.
