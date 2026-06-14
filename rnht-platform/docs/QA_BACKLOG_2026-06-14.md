# RNHT QA Backlog — 2026-06-14 deep audit

_From a multi-agent deep-QA workflow (41 agents) over the under-audited surfaces
(booking, admin CRUD, dashboard/profile/family, donate edge cases) + a regression
check of the day's changes. **28 findings, adversarially verified.**_

**Headline:** the **donor-facing core is solid and was runtime-validated** on web +
iOS + Android (home, services, donate→Stripe, panchangam, gallery, news, calendar,
auth/dashboard with real data). The findings below are almost entirely **admin
internal tooling + incomplete secondary features** — a hardening backlog for
**before the public App Store / Play Store launch**, not blockers for the current
beta. None were churned mid-beta (regression risk); fixes are listed for a focused pass.

---

## ✅ Staged this session

- **BK-01 (blocker, admin) — bookings had no admin UPDATE/DELETE RLS policy.**
  Admin Confirm/Complete/Cancel silently no-op'd (RLS matched 0 rows → phantom
  success → reverts on refresh). Migration **`005_bookings_admin_update.sql`**
  created (mirrors the services/events/priests admin pattern). **ACTION: apply to
  the live DB** (`supabase db push` or management API) — I lacked the mgmt token in
  the build env. Practically latent today: there is no in-app booking-creation path
  (see CR-02), so the table is effectively empty until that's built.

---

## A. Donor-facing (resolve before public launch; beta-acceptable now)

- **Dead "coming soon" buttons in the donor portal** (`src/app/profile/page.tsx`):
  Tax Summary (613), per-row Download Receipt (641), Export My Data (722),
  Reschedule/Cancel/Rebook (590/591/595). The annual tax-summary email backend
  exists (`src/lib/donation-receipts.ts`, >$750 auto-emailed) but there is no
  on-demand download endpoint. **Fix:** wire a download endpoint, OR remove/relabel
  the buttons (honest copy + the (512) 545-0473 contact already used). _Product
  decision — not changed unilaterally._
- **Admin-created donation funds are rejected at donate time** (high) — the donate
  edge fn (`supabase/functions/donate/index.ts`) hardcodes a fund allowlist, so any
  fund an admin adds shows in the dropdown but every donation to it 400s. **Fix:**
  validate fund_type against the `donation_types` table instead of the hardcoded
  list; redeploy the edge fn. (Default funds work — only custom funds break.)
- **Stripe/PayPal verify-failure strands a paid donation** (medium) — on verify
  failure the UI says "contact the temple" and strips session_id, no in-app retry.
  Same root as the native payment-return gap → **fix with webhooks** (see
  LAUNCH_READINESS native follow-ups H1/M1/M2; needs live Stripe + real device).
- **>$100k donation silently capped client-side** (low) — server rejects it but the
  client shows/charges the cap. Align client to surface the cap explicitly.
- **Blank donor name → "Anonymous"** even for a signed-in donor who cleared it
  (low). Fall back to the profile name for signed-in donors.
- **"Pending" donations** render the full amount with an amber label while totals
  exclude them (low) — display nuance; consider a clearer treatment.

## B. Admin internal tooling (staff-only; safe error-handling fixes)

These are mostly **silent write-error swallowing** — the fix is additive
(`const { error } = await …; if (error) { setError(…); return; }`), low-risk, but
several self-correct via a subsequent `refresh()`. Do as one focused pass:

- **Slideshow add/update/remove + hide/show** swallow Supabase errors → UI reports
  success on a failed write (`src/app/admin/slideshow/page.tsx`). (high/medium)
- **Event delete** discards the delete error inside `confirmOrQueue.run`
  (`src/app/admin/events/page.tsx:54`). (medium — refresh() self-corrects UI)
- **Priest head-demote partial write** (`src/app/admin/priests/page.tsx:146-152`) —
  demotes the existing head before the main write; a failed write leaves **zero
  head priests**. Demote-first is required by a partial unique index, so the proper
  fix is a **DB transaction/RPC** (or at minimum error-check the demote + restore).
- **Slideshow new-slide sort_order** defaults to `slides.length`, can collide after
  deletes/reorders → nondeterministic ordering. Use `max(sort_order)+1`.
- **Approval queue is cosmetic** (medium) — pending approvals live only in the
  requesting editor's localStorage; no backend. Slideshow ops also bypass it.
  `resolveAdminRole` defaults to 'approver' when env unset → queue is a no-op.

## C. Feature-completeness gaps (product decisions / larger work)

- **CR-02: No in-app booking-creation path** — the `bookings` table is never
  inserted; the Stripe-webhook booking branch and admin bookings dashboards have no
  producer. Either build the booking flow or treat booking as WhatsApp/Call-only
  (the services page already does this) and retire the bookings UI.
- **Preferences tab** (language/notifications/deities/dietary) has no state/save —
  all controls cosmetic (`src/app/profile/page.tsx`).
- **Family members** can be added/removed but **not edited** despite rich fields.
- **Two divergent profile editors** (`/profile` and the dashboard Profile tab) with
  different validation/fields — consolidate.
- **Custom donation fields** persisted raw, validation is client-only — add server
  validation in the donate edge fn.
- **Profile email change** commits `profiles.email` independently of
  `auth.users.email` — partial-write risk; make it atomic / ordered with rollback.

## D. Navigation / discoverability

- **5 finished pages are orphaned** (no in-app link, only in `sitemap.ts`):
  `community`, `education`, `sponsorship`, `streaming`, `transparency`. A user can't
  reach them; SEO indexes them. **Decide:** surface the launch-ready ones (footer
  Quick Links) or remove the not-ready ones from `src/app/sitemap.ts`.
  (`/calendar`, `/news` are correctly linked; `/contact` intentionally → WhatsApp.)

## E. Verified clean / non-issues (no action)

- Donation status-filter literals match the DB today (latent fragility only).
- The day's changes (calendar recurrence cadence, native env guard, Android
  strings, armv7→arm64, deleted action, back-button overlay registrations) — **no
  regressions found**; recurrence formatter handles every rule in sample-data.
