# Supabase Edge Functions

These Deno-runtime functions back the donate flow on the
static-export Firebase deploy. The Next.js `/api/*` route handlers
are not reachable in static export, so anything that needs server
secrets (Stripe, PayPal, the Supabase service-role key) lives here
instead.

## What's deployed

| Function          | Purpose                                                       |
|-------------------|---------------------------------------------------------------|
| `donate`          | `POST` creates a Stripe Checkout session or PayPal order.<br>`GET ?session_id=…` verifies a Stripe session and marks the donation paid. |
| `paypal-capture`  | `POST {orderId}` captures an approved PayPal order and marks the donation paid. |
| `send-donation-receipt` | `POST {donationId}` (admin) emails the tax receipt for a donation an admin marked received. |
| `record-manual-donation` | `POST {id, donorName, donorEmail, amount, fundType, note, receiptId, pdfBase64, filename}` (admin) files a **cash/offline** donation as completed and emails the donor the receipt PDF. Backs the admin "Record Donation" tab. Requires migration `007` (adds `cash`/`offline` to the `payment_method` CHECK) and the `RESEND_API_KEY`/`RECEIPT_FROM` secrets. |
| `stripe-webhook` | `POST` (Stripe only, signature-verified) completes a Checkout donation the donor never came back to verify, and marks a donation **refunded** on Stripe refunds / chargebacks. See [stripe-webhook](#stripe-webhook) below. Requires migration `014` and the `STRIPE_WEBHOOK_SECRET` secret. |

Recurring (subscription) donations and the PayPal webhook handler are
intentionally not ported yet — see the TODO at the bottom.

## One-time setup

1. **Resume the Supabase project** if paused
   (`https://supabase.com/dashboard/project/<ref>`).
2. **Install the Supabase CLI**:
   ```sh
   brew install supabase/tap/supabase   # macOS
   # or:  npm i -g supabase
   ```
3. **Log in & link to the project**:
   ```sh
   supabase login
   cd rnht-platform
   supabase link --project-ref <project-ref>
   ```
   The project ref is the subdomain part of your Supabase URL
   (e.g. `ewimquyiggitbfleicbr.supabase.co` → `ewimquyiggitbfleicbr`).

## Setting secrets

Edge Functions read secrets from `Deno.env.get(...)`. Set them with:

```sh
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  PAYPAL_CLIENT_ID=... \
  PAYPAL_SECRET=... \
  PAYPAL_MODE=live \
  APP_URL=https://rnht-platform.web.app
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically
by Supabase — don't set them yourself.

## Deploying

```sh
cd rnht-platform
supabase functions deploy donate
supabase functions deploy paypal-capture
supabase functions deploy send-donation-receipt
supabase functions deploy record-manual-donation
# record-manual-donation also needs the migration that allows the 'cash' method:
supabase db push        # applies supabase/migrations/007_manual_donation_payment_method.sql
```

Each deploy is its own version; rollback with
`supabase functions deploy <name> --legacy-bundle` or via the dashboard.

## Verifying

```sh
# CORS preflight
curl -i -X OPTIONS https://<ref>.supabase.co/functions/v1/donate \
  -H "Origin: https://rnht-platform.web.app"

# Create a $1 test donation
curl -X POST https://<ref>.supabase.co/functions/v1/donate \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"amount":1,"fundType":"general","donorName":"Test","donorEmail":"test@example.com","paymentMethod":"stripe"}'
```

You should get back `{ "url": "https://checkout.stripe.com/..." }`.

## Required Stripe / PayPal dashboard setup

For Stripe live mode:
1. Activate live mode in the Stripe dashboard.
2. Make sure Apple Pay is enabled under
   Settings → Payments → Payment methods.
3. Register the webhook endpoint — see the [stripe-webhook](#stripe-webhook)
   section below.

For PayPal live mode:
1. Create a REST app in PayPal Developer dashboard, switch to "Live".
2. Copy Client ID + Secret into the `PAYPAL_CLIENT_ID` and
   `PAYPAL_SECRET` secrets, set `PAYPAL_MODE=live`.

## Client wiring

`src/lib/edge-functions.ts` builds the function URLs from
`NEXT_PUBLIC_SUPABASE_URL` and signs requests with
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both should already be in
`.env.local` for the dev/build. If `NEXT_PUBLIC_SUPABASE_URL` is
unset, the helper falls back to the legacy `/api/*` paths so
`next dev` and Vercel deploys still work.

## TODO — not yet ported

1. **Stripe webhook handler** — PARTIALLY DONE (2026-09-02):
   `stripe-webhook` handles `checkout.session.completed` (+
   `async_payment_succeeded`), refunds/disputes (`charge.refunded`,
   `charge.dispute.created`, `charge.dispute.funds_withdrawn`) and won
   disputes (`charge.dispute.closed`, `charge.dispute.funds_reinstated`).
   **Still not ported:** `invoice.payment_succeeded` (recurring
   donations); the function currently logs and ignores it, so
   subscriptions must stay disabled client-side until it is added.
2. **PayPal webhook handler** (subscription / dispute events).
3. **Service checkout** (`/api/checkout` for cart bookings) — not
   currently used by the UI, but porting needed before the cart goes
   live.
4. **Receipt email** (`checkAndSendReceipt`). The Next.js routes
   triggered Resend after each completed donation; that path isn't
   wired into the Edge Function yet.

The Stripe endpoint is registered per the `stripe-webhook` section
above; a PayPal webhook would follow the same shape under
`supabase/functions/paypal-webhook/`.

## stripe-webhook

Stripe → temple reconciliation. Three jobs:

1. **`checkout.session.completed` / `checkout.session.async_payment_succeeded`**
   — completes a donation exactly the way `donate` `GET ?session_id=` does
   (guarded `pending → completed` flip, single-winner `tax_receipt_sent`
   claim, guest back-link, receipt email), so a donor who closes the tab
   before the success page is still recorded and receipted. Idempotent:
   a replayed event or a race with the donor's own verify can never
   double-flip or double-send, because the row guards (not the function)
   decide. Before the flip the session is cross-checked against the row:
   the row must be `payment_method = 'stripe'` and the session's
   `amount_total` / `currency` must equal the row's amount in USD (as
   `paypal-capture` already does), so a session that merely *names* a
   `donation_id` cannot complete a row for a different amount or a
   pending Zelle/PayPal pledge; a mismatch is logged, acknowledged with
   `200` and never completed. Also stores
   `custom_fields.stripe_payment_intent` (`pi_…`) so refunds can be
   matched directly; `payment_intent_id` keeps holding the Checkout
   Session id (`cs_…`) as before.
2. **`charge.refunded` / `charge.dispute.created` / `charge.dispute.funds_withdrawn`**
   — finds the donation (by `custom_fields.stripe_payment_intent`, else
   by listing the Checkout Session for the PaymentIntent) and flips it to
   `refunded`, recording
   `custom_fields.refund = {event_id, source, amount_refunded, amount_charged, partial, reason, charge_id, at}`.
   A **partial** refund still marks the row `refunded` (conservative for
   tax receipts) with the amount recorded. A row that is still `pending`
   (Stripe does not order deliveries: the refund can land before the
   checkout event) is flipped straight to `refunded` too, so the later
   checkout event finds nothing to complete and nothing to receipt.
   `warning_*` disputes (inquiries / early-fraud warnings, funds not
   withdrawn) are ignored until Stripe sends
   `charge.dispute.funds_withdrawn`. Every reader keys on
   `payment_status = 'completed'`, so a refunded gift drops out of the
   admin totals, the donor dashboard, `send-donation-receipt` and the
   year-end batch automatically; the admin Inflow list shows it as a red
   `refunded` pill and the donor dashboard as "Refunded".
3. **`charge.dispute.closed` (status `won`) / `charge.dispute.funds_reinstated`**
   — the temple won the chargeback and the money is back: flips
   `refunded → completed` again, **only** when the refund on record came
   from a `charge.dispute.*` event for the same amount (a genuine
   `charge.refunded` is never reverted), and records
   `custom_fields.refund.reinstated = {event_id, source, amount, at}`.
   The receipt claim then runs once more: if a receipt already went out it
   loses and nothing is sent; if the gift was never receipted (disputed
   before the checkout event landed) the donor gets the one receipt they
   are owed.

Every event must also match the **mode** of `STRIPE_SECRET_KEY`
(`event.livemode` vs `sk_live_`/`rk_live_`): a test-mode event reaching
the live deployment is logged and dropped with `200`, so a test-mode
endpoint secret can never complete or refund live rows.

Responses: `200` for handled, ignored, mismatched and not-found events
(Stripe would otherwise retry for days), `400` only for a missing/invalid
signature, `500` when `STRIPE_WEBHOOK_SECRET` is unset or a DB/Stripe
call fails while applying an event — including the completion flip and
the receipt claim (Stripe retries those; every write is guarded, so a
redelivery after a half-applied attempt cannot double-flip or
double-send).

**Endpoint URL:** `https://ewimquyiggitbfleicbr.supabase.co/functions/v1/stripe-webhook`

**Setup, in this order:**

1. Apply migration `014_refunded_status.sql` **first** (adds `refunded`
   to the `donations.payment_status` CHECK; without it the refund flip
   fails with 23514 and the function answers 500 so Stripe keeps
   retrying):
   ```sh
   npx supabase@latest db push --project-ref ewimquyiggitbfleicbr
   ```
2. In the Stripe dashboard, **in LIVE mode** (the mode toggle is
   top-right; endpoints and their secrets are per mode, and the function
   drops events whose mode differs from `STRIPE_SECRET_KEY`), go to
   Developers → Webhooks → **Add endpoint**, URL above, and subscribe to
   exactly these events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `charge.refunded`, `charge.dispute.created`, `charge.dispute.funds_withdrawn`,
   `charge.dispute.closed`, `charge.dispute.funds_reinstated`.
   Copy the endpoint's signing secret (`whsec_…`).
3. Set the secret (a NEW secret; `STRIPE_SECRET_KEY` is reused as-is):
   ```sh
   npx supabase@latest secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref ewimquyiggitbfleicbr
   ```
4. Deploy **without** JWT verification — Stripe cannot send a Supabase
   JWT; the function authenticates the request by verifying Stripe's
   signature over the raw body instead:
   ```sh
   npx supabase@latest functions deploy stripe-webhook --project-ref ewimquyiggitbfleicbr --no-verify-jwt --use-api
   ```
5. Verify: Stripe dashboard → the endpoint → **Send test event**
   (`charge.refunded`) should return
   `200 {"received":true,"ignored":true,"reason":"livemode mismatch"}`
   (the dashboard's test events are test-mode and the deployment is live;
   with a test-mode key and secret it returns `{"received":true,"found":false}`
   instead, since a test charge maps to no donation), and an unsigned
   `curl -X POST <url> -d '{}'` must return `400`.

Not handled yet: `invoice.payment_succeeded` (recurring donations) — logged
and ignored, see the TODO list.
