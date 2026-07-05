# Zelle pledge follow-up — what's live vs. staged (2026-07-04)

Client concern: on a Zelle pledge the temple couldn't easily reach the donor or
reconcile whether the transfer arrived.

## LIVE now (no token/key needed)
- Donate form captures an optional **Phone** (stored in donations.custom_fields.donor_phone).
- Admin → Donations "Inflow" shows a **Contact** column: donor email (mailto:) + phone (tel:)
  for every row, so the temple can follow up on any pending pledge.

## STAGED — needs a Supabase token (deploy) + Resend key (email)
1. **migrations/006_donation_admin_update.sql** — admin UPDATE RLS on donations
   (apply via mgmt API / `supabase db push`). Without it the "Mark received" button is RLS-blocked.
2. **Admin "Mark received → completed" button** on pending donation rows
   (flips payment_status pending→completed; then the receipt email below fires).
   Code: add a per-row action calling
   `supabase.from('donations').update({payment_status:'completed'}).eq('id', id)`.
3. **Temple notification on new Zelle pledge** — in supabase/functions/donate/index.ts,
   after the Zelle insert, if `TEMPLE_NOTIFY_EMAIL` + `RESEND_API_KEY` are set, email the temple:
   "New Zelle pledge: {name}, {amount}, {email}/{phone} — watch for the transfer."
4. **Donor receipt on mark-received** — reuse donation-receipts.ts email path (already used by
   Stripe verify) so completing a Zelle pledge emails the tax-deductible acknowledgment.

Env needed: RESEND_API_KEY, RECEIPT_FROM (verified domain), TEMPLE_NOTIFY_EMAIL.
