-- STAGED (apply when a Supabase token is available): lets temple admins mark a
-- pending Zelle pledge as received. Currently donations has only "Anyone can
-- create" (INSERT) + "Admins can view all" (SELECT) — no UPDATE — so the admin
-- "Mark received" button (donate-follow-up feature, 2026-07-04) is RLS-blocked
-- until this runs. is_admin() mirrors the guard used by the SELECT policy.
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;
CREATE POLICY "Admins can update donations"
  ON public.donations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
