-- Idempotency ledger for the automated year-end consolidated tax receipts.
--
-- The January batch (scripts/send-year-end-receipts.ts, run by GitHub Actions)
-- inserts one row per donor per tax year AFTER their consolidated
-- acknowledgment is emailed. The UNIQUE(donor_email, tax_year) constraint makes
-- a re-run a no-op for donors already sent — a donor can never be double-mailed
-- their statement, even if the job is re-triggered or partially fails and
-- retries. The batch writes with the service role (bypasses RLS); clients get
-- read-only access for an admin "who received their 2026 statement" view.

CREATE TABLE IF NOT EXISTS public.year_end_receipts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_email    text          NOT NULL,
  tax_year       integer       NOT NULL,
  donation_count integer       NOT NULL,
  total_amount   numeric(12,2) NOT NULL,
  -- Resend message id, for delivery tracing. Null if the send path didn't
  -- return one (still recorded as sent so it isn't retried).
  message_id     text,
  sent_at        timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT year_end_receipts_email_year_uniq UNIQUE (donor_email, tax_year),
  CONSTRAINT year_end_receipts_total_nonneg CHECK (total_amount >= 0),
  CONSTRAINT year_end_receipts_year_sane CHECK (tax_year BETWEEN 2020 AND 2100)
);

-- Fast lookup of "already sent for year Y" during the batch's pre-filter.
CREATE INDEX IF NOT EXISTS year_end_receipts_year_idx
  ON public.year_end_receipts (tax_year);

ALTER TABLE public.year_end_receipts ENABLE ROW LEVEL SECURITY;

-- Admins may read the ledger (e.g. a future admin report). No client
-- INSERT/UPDATE/DELETE policy exists, so only the service-role batch can write.
DROP POLICY IF EXISTS "Admins can view year_end_receipts" ON public.year_end_receipts;
CREATE POLICY "Admins can view year_end_receipts"
  ON public.year_end_receipts
  FOR SELECT TO authenticated
  USING (public.is_admin());
