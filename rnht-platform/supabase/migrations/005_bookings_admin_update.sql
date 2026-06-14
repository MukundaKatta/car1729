-- 005_bookings_admin_update.sql
--
-- Deep-QA audit (2026-06-14) found that public.bookings has SELECT + INSERT
-- policies but NO admin UPDATE/DELETE policy. The admin bookings page
-- (src/app/admin/bookings/page.tsx) uses the RLS-bound anon/auth client to
-- flip booking status (Confirm / Mark Completed / Cancel). With no UPDATE
-- policy, PostgREST matches zero rows, returns 204 with error=null, the
-- optimistic UI flips the badge, but the row is unchanged and reverts on
-- refresh — booking management is silently non-functional for admins.
--
-- Mirror the exact admin pattern already used for services/events/priests/
-- donation_types/news_posts in 002 (FOR ALL USING(is_admin()) WITH CHECK).
-- Purely additive: grants an admin UPDATE+DELETE path that does not exist
-- today; cannot alter the existing anon-INSERT or owner-SELECT behavior.
--
-- NOTE: a UNIQUE/atomicity caveat does not apply here. Apply to the live DB
-- via the management API (or `supabase db push`) — it was authored but NOT
-- yet applied to prod (no management token was available in the build env).

DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin());
