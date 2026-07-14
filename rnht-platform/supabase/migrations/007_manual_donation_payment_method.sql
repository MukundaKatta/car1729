-- STAGED (apply when a Supabase token is available): allows the admin Manual
-- Donation Receipt flow (record-manual-donation edge function, 2026-07-13) to
-- file a cash / offline gift. The donations.payment_method CHECK originally
-- permitted only ('stripe','paypal','zelle'); a manually-recorded cash donation
-- needs a truthful method value. CHECK constraints are enforced even for the
-- service-role client, so without this the manual-donation insert fails with a
-- check violation.
--
-- Widens the allowed set to include 'cash' and 'offline'. Existing rows are
-- unaffected (all use one of the original three values).
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_payment_method_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_payment_method_check
  CHECK (payment_method IN ('stripe', 'paypal', 'zelle', 'cash', 'offline'));
