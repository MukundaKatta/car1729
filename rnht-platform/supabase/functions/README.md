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

Recurring (subscription) donations and Stripe/PayPal webhook handlers
are intentionally not ported yet — see the TODO at the bottom.

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
3. (Webhook setup is documented under the TODO section below.)

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

1. **Stripe webhook handler** (`checkout.session.completed`,
   `invoice.payment_succeeded`). Needed for recurring donations and
   for reconciling donations the donor doesn't come back to verify.
2. **PayPal webhook handler** (subscription / dispute events).
3. **Service checkout** (`/api/checkout` for cart bookings) — not
   currently used by the UI, but porting needed before the cart goes
   live.
4. **Receipt email** (`checkAndSendReceipt`). The Next.js routes
   triggered Resend after each completed donation; that path isn't
   wired into the Edge Function yet.

When you're ready to port webhooks: register the endpoint in the
Stripe dashboard pointing at
`https://<ref>.supabase.co/functions/v1/stripe-webhook`, grab the
signing secret, and add a new function under
`supabase/functions/stripe-webhook/`.
