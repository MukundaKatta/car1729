-- 004_policy_completeness.sql
--
-- Two non-destructive hardening/correctness fixes surfaced by the zero-bug audit:
--
-- 1) profiles UPDATE policy completeness: "Users can update own profile" had a
--    USING (auth.uid() = id) clause but NO WITH CHECK, so the row a user updates
--    wasn't constrained to still be their own. Add the matching WITH CHECK.
--    (is_admin is independently protected by the enforce_is_admin_immutable
--    trigger from 003; this just completes the policy.)
--
-- 2) donations.fund_type default was the human label 'General Temple Fund'
--    instead of a slug, so a direct insert omitting fund_type would store a
--    non-slug value. Default to the canonical 'general' slug.
--
-- Idempotent-ish: ALTER POLICY / SET DEFAULT are safe to re-run.

ALTER POLICY "Users can update own profile"
  ON public.profiles
  WITH CHECK (auth.uid() = id);

ALTER TABLE public.donations
  ALTER COLUMN fund_type SET DEFAULT 'general';
