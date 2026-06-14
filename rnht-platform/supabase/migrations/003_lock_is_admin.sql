-- 003_lock_is_admin.sql
--
-- SECURITY: close the is_admin privilege-escalation hole.
--
-- The profiles UPDATE RLS policy ("Users can update own profile",
-- 001_initial_schema) is USING (auth.uid() = id) with no WITH CHECK and no
-- column restriction. Postgres RLS cannot restrict columns, so any signed-in
-- user could `update profiles set is_admin = true where id = <self>` and gain
-- admin (admin access is gated solely by profiles.is_admin — src/lib/admin.ts).
--
-- Fix: a BEFORE UPDATE trigger that rejects any change to is_admin unless the
-- caller is the service role (auth.uid() IS NULL — server/edge context) or is
-- already an admin. SECURITY DEFINER so the admin lookup bypasses RLS.
--
-- NOTE: this trigger is ALREADY applied to the live database (verified
-- 2026-06-13 via pg_trigger). This file simply brings the migrations/ directory
-- in sync so a fresh `supabase db reset` / migrations-based redeploy recreates
-- it instead of silently dropping the protection. Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.enforce_is_admin_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Service role / server context has no JWT subject — allow it.
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    -- Otherwise the caller must already be an admin.
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    ) THEN
      RAISE EXCEPTION 'Not authorized to change admin status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_is_admin_immutable ON public.profiles;

CREATE TRIGGER trg_enforce_is_admin_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_is_admin_immutable();
