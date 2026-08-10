-- Close the client write surface exposed by aggressive pentest 2026-08-10.
--
-- Root cause (all one class): the donations/bookings/activities tables each had
-- a "users can insert own <table>" RLS INSERT policy left over from an earlier
-- design. The app NO LONGER inserts any of these from the client:
--   * donations  -> created only by the donate / record-manual-donation edge
--                   functions (service_role, which bypasses RLS).
--   * bookings   -> no client insert path exists at all (creation was never
--                   built; the Stripe webhook UPDATEs, it does not INSERT).
--   * activities -> the client keeps activity items in local state only; nothing
--                   writes this table from a client session.
-- So these INSERT policies grant zero legitimate capability and are pure attack
-- surface. Concretely they allowed a signed-in devotee to:
--   * HIGH: self-insert a booking with status='completed', payment_status='paid',
--           total_amount=0 for any service at any price — a full payment/authz
--           bypass that also corrupts the admin YTD revenue dashboard
--           (SUM(total_amount) WHERE payment_status='paid').
--   * self-insert donation rows with negative/zero amount, spoofed donor_name/
--           donor_email, out-of-catalog fund_type, and a pre-set
--           tax_receipt_sent=true (which could suppress a real receipt).
--   * fabricate their own activity-feed entries.
-- Dropping the policies removes the surface entirely; edge functions (service
-- role) are unaffected. If a client booking/donation flow is ever built, add a
-- correctly-scoped policy at that time (mirroring the pending-only pattern).

DROP POLICY IF EXISTS "Users can insert own donations"  ON public.donations;
DROP POLICY IF EXISTS "Users can insert own bookings"   ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;

-- Defense in depth: make the DB itself authoritative on amounts, so no future
-- policy change or edge-function bug can persist a nonsensical value. The
-- service-role edge inserts already validate these, so the constraints only ever
-- reject bad data.
ALTER TABLE public.donations
  ADD CONSTRAINT donations_amount_positive CHECK (amount > 0);
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_total_amount_nonneg CHECK (total_amount >= 0);

-- Guard phone_verified the same way is_admin is guarded: a devotee must not be
-- able to self-assert a verified phone (no OTP challenge exists). The column is
-- currently unused by the app, but freeze it now so it can safely become a trust
-- signal later. Silently revert rather than raise, so a normal profile save that
-- happens to include the field never errors. Service role (auth.uid() IS NULL)
-- and admins may still set it.
CREATE OR REPLACE FUNCTION public.enforce_phone_verified_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.phone_verified IS DISTINCT FROM OLD.phone_verified
     AND auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    ) THEN
      NEW.phone_verified := OLD.phone_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_phone_verified ON public.profiles;
CREATE TRIGGER trg_enforce_phone_verified
  BEFORE UPDATE OF phone_verified ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_phone_verified_guard();

-- Storage: stop object-name enumeration of the public buckets. Public downloads
-- go through /object/public/<bucket>/<path>, which is served on the bucket's
-- public flag and does NOT consult this RLS policy; the app never calls
-- storage .list(). So scoping SELECT to admins keeps every download and the
-- admin panel working while denying anon/devotee clients the ability to LIST
-- every uploaded file's name/size/metadata (turning "public but unlisted" back
-- into genuinely unlisted).
DROP POLICY IF EXISTS rnht_public_read_buckets ON storage.objects;
CREATE POLICY rnht_admin_list_buckets ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = ANY (ARRAY['service-pdfs','priests','news','slideshow','service-images'])
    AND public.is_admin()
  );
