-- Guarantee the lowercase-email invariant that donation<->account linking relies on.
--
-- The guest back-link matches `profiles.email = lower(trim(donor_email))`. That
-- is only correct while stored addresses are already normalized. Today they are
-- (profiles are created by the on_auth_user_created trigger from auth.users,
-- which Supabase lowercases), but nothing ENFORCES it — a future admin tool,
-- import, or profile-edit feature writing "Donor@Example.com" would silently
-- stop matching, and the gift would vanish from that devotee's history and from
-- their year-end 501(c)(3) total. Make the invariant structural instead of
-- incidental.

CREATE OR REPLACE FUNCTION public.normalize_email_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.email := lower(btrim(NEW.email));
  ELSE
    NEW.donor_email := lower(btrim(NEW.donor_email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_normalize_email ON public.profiles;
CREATE TRIGGER trg_profiles_normalize_email
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_columns();

DROP TRIGGER IF EXISTS trg_donations_normalize_email ON public.donations;
CREATE TRIGGER trg_donations_normalize_email
  BEFORE INSERT OR UPDATE OF donor_email ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_columns();

-- Backfill any rows that predate the triggers (currently none, but this makes
-- the migration correct on any environment).
UPDATE public.profiles  SET email = lower(btrim(email))
  WHERE email IS NOT NULL AND email <> lower(btrim(email));
UPDATE public.donations SET donor_email = lower(btrim(donor_email))
  WHERE donor_email IS NOT NULL AND donor_email <> lower(btrim(donor_email));
