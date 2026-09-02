-- Gap T (2026-09-02): nothing prevented two profiles from sharing an email, so
-- the .maybeSingle() lookups in the edge functions could silently fail and a
-- gift could be linked to the wrong account. auth.users already enforces unique
-- emails and profiles mirror them 1:1, so this only guards manual edits.
-- PARTIAL: two legacy profiles have a blank email; those are excluded rather
-- than made to collide. Idempotent.
create unique index if not exists profiles_email_norm_uniq
  on public.profiles (lower(btrim(email)))
  where email is not null and btrim(email) <> '';
