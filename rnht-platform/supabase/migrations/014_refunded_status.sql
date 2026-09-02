-- Gap B/F (2026-09-02): Stripe refunds and disputes.
--
-- The stripe-webhook edge function (supabase/functions/stripe-webhook) flips a
-- donation 'completed' -> 'refunded' on charge.refunded,
-- charge.dispute.created and charge.dispute.funds_withdrawn, recording the
-- Stripe event under custom_fields.refund. The donations.payment_status CHECK
-- from 001_initial_schema.sql permits only ('pending','completed','failed'),
-- and CHECK constraints bind the service-role client too, so that flip fails
-- with 23514 until this runs. Apply BEFORE deploying stripe-webhook.
--
-- Why a status rather than deleting the row: every reader keys on
-- payment_status = 'completed' (admin totals, the donor dashboard allowlist,
-- send-donation-receipt, the year-end receipt batch), so a 'refunded' row
-- drops out of totals and receipts automatically while the audit trail stays.
--
-- Idempotent: DROP IF EXISTS + ADD, so re-running is a no-op. Existing rows all
-- hold one of the original three values, so the new CHECK validates cleanly.
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_payment_status_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_payment_status_check
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));
