# RNHT Runtime UAT — Findings (2026-06-15)

Real-user runtime testing of the **production static export** (the exact artifact
Firebase serves), driven with headless Chromium (Playwright) + direct API probes.
Web app build 18. Screenshots in `~/Claude/rnht-uat-screens/`.

## ✅ SECURITY — VERIFIED SECURE on the live DB (correction)

> **Correction to an earlier draft:** I initially flagged a "critical PII leak" on
> `profiles`/`donations`. That was a **FALSE ALARM**. I had minted my QA session
> with `mukunda.vjcs6@gmail.com`, which **is the temple admin** (the only admin of
> 14 profiles). The "Admins can view all" policy correctly let that account read
> all rows — that's intended admin behaviour for `/admin/donations`, not a leak.
> No migration 006 was applied (it was deleted); nothing needed fixing.

Verified directly against the **live** database (Supabase admin), 2026-06-15:

### SEC-1 — `profiles` / `donations` / `bookings` RLS is correct
Proven by toggling `profiles.is_admin` live and re-querying with the same JWT:
- **admin** → profiles 14, donations 43 (all — by design, for `/admin`).
- **non-admin** (flag off) → profiles **1** (own), donations **own-only** — isolated.
- **anonymous** (no JWT) → **0** rows.
Policies: `Users can view own …` (`auth.uid() = id/user_id`) + `Admins can view all …`
(`is_admin()`). `is_admin()` is `SECURITY DEFINER` and checks the caller's own row.

### SEC-2 — `is_admin` self-grant escalation is BLOCKED
As a non-admin, `PATCH /profiles?id=eq.<me> {is_admin:true}` returns **HTTP 400**
and the value stays `false` (the 003 lock trigger). No privilege escalation.

## 🟠 HIGH — broken feature

### DON-PAYPAL — PayPal blocked on creds (client verified via mock)
In PROD, PayPal + Donate → `POST /functions/v1/donate` returns
`500 {"error":"Failed to process donation"}` (confirmed by direct curl; Stripe on
the same endpoint returns 200) because `PAYPAL_CLIENT_ID`/`PAYPAL_SECRET` aren't
set in the deployed edge-fn. The user sees a graceful red error (no crash).
**Mocked the two PayPal calls and drove the real client end-to-end** (no creds,
live backend untouched): order-create → approval redirect → capture COMPLETED →
**confirmation screen** "Thank You… Your donation of $13.00 to the General Temple
Fund has been received." → the **client PayPal integration is correct**.
**Action:** set the PayPal secrets (`supabase secrets set PAYPAL_CLIENT_ID=…
PAYPAL_SECRET=… PAYPAL_MODE=sandbox|live`) **or** hide the PayPal option. Stripe + Zelle work.

### DON-CONFIRM-RACE (FOUND + FIXED) — confirmation screen never showed after a paid donation
While mock-testing PayPal I hit a **real, higher-impact bug affecting BOTH Stripe
and PayPal**: after a successful payment return, the **confirmation screen never
appeared** — the donor was dropped back to the donate form with no acknowledgement
(even though the charge succeeded). Cause: the return handler in
`src/app/donate/page.tsx` fired `verifyDonation()` async then immediately
`replaceState`-stripped `?success`; under the static export that re-ran the effect,
whose cleanup set `cancelled=true` and **aborted verification before
`setSubmitted`**. **Fix:** single-run `useRef` guard + read-params-then-strip,
removed the `cancelled`-abort. Verified: before = confirmation 0/3 trials; after =
3/3 (shows in ~200ms, "$13.00 received"). Gated: tsc clean + 752 tests pass +
static export rebuilt. **Needs deploy** (web redeploy + native rebuild) to reach users.

## ✅ PASS — verified working (with real screenshots)

- **All 20 routes** (18 public + dashboard/profile), desktop **and** mobile:
  HTTP 200, no crashes, **zero console/page errors**. Homepage hero (3 deities),
  donate, panchangam, services, calendar, gallery, news, priests, about, terms,
  privacy all render.
- **i18n** — all **10 languages** switch via the UI globe; `<html lang>` syncs;
  native scripts render (te/hi/ta/kn/mr/ml/gu/bn/pa). Punjabi donate title
  `ਸਾਡੇ ਮੰਦਰ ਦਾ ਸਮਰਥਨ` renders clean Gurmukhi (prior stray-glyph bug confirmed fixed).
- **Donate / Stripe** → reaches `checkout.stripe.com/.../cs_test_…` with the
  **"rnht sandbox / Sandbox"** badge, correct fund + amount + email. NOT completed.
- **Donate / Zelle** → shows "Please send your Zelle payment of $X to
  (512) 545-0473" + records a pending pledge.
- **Donate validation** — $0/empty-email and malformed email do not proceed;
  9-digit overflow amount capped to $100,000.00.
- **Auth (email OTP)** — send + verify produce a real session; dashboard, profile,
  family **add/edit/remove**, profile edit/save, all tabs, **delete-account dialog**
  (opened + cancelled, never confirmed), and **sign-out** all work.
- **Admin area** (signed in as the temple admin) — all **10 `/admin/*` pages** render
  with live data, 0 console errors: Dashboard ($42 YTD), Donations inflow (donor
  table), Bookings, Events, News, Priests, Services, Service upload, Slideshow,
  Volunteers.
- **Native** — **build 18 launches + renders** on both the iOS 17 Pro simulator and
  the Android emulator (full RNHT UI, no white screen, no crash).
- **DB hardening** — applied `005_bookings_admin_update.sql` to live (admins can now
  UPDATE/DELETE bookings → Confirm/Cancel works). INSERT policies already owner-scoped.

## Test data created (identifiable; safe to delete)
A few **pending** donation rows from Stripe/Zelle checkout tests, donor
"UAT TEST - Mukunda" / mukunda.vjcs6@gmail.com, small amounts ($11/$13/$51). No
payments completed. The test family member and profile edits were reverted —
Mukunda's account left clean (own row: phone empty, gotra/nakshatra/rashi null,
0 family members).

## Not covered here
Deep native interaction (on-device auth/donate gestures) — only launch+render
confirmed headlessly; real-payment completion (prohibited; Stripe in test mode);
admin write-operations (create/edit/delete content) — pages load, mutations not exercised.
