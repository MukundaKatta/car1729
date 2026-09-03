-- 016: profiles.email follows the CONFIRMED auth identity only.
--
-- Bug (QA 2026-09-02): any signed-in devotee could PATCH profiles.email to an
-- arbitrary address. auth.updateUser() merely mails a confirmation link, but the
-- client wrote profiles.email immediately, and trg_profiles_backlink_donations
-- (012, SECURITY DEFINER) then re-linked every guest gift under that address to
-- the caller, while profiles_email_norm_uniq (013) locked the real owner out of
-- ever holding the address. Fix:
--   1. a BEFORE UPDATE guard: a request carrying a user JWT can never change
--      profiles.email (service role / SQL / auth-admin contexts have no uid);
--   2. auth.users.email -> profiles.email sync, so a change lands only after
--      Supabase Auth confirms it (and the 012 back-link then runs for the
--      rightful owner);
--   3. a one-time repair that resets any profile whose email drifted from its
--      auth identity back to the confirmed address.
-- Idempotent.

create or replace function public.guard_profile_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email and auth.uid() is not null then
    raise exception 'Email is changed from account settings and takes effect after you confirm the new address'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_email_change() from public;

drop trigger if exists trg_profiles_guard_email on public.profiles;
create trigger trg_profiles_guard_email
  before update of email on public.profiles
  for each row execute function public.guard_profile_email_change();

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    begin
      update public.profiles set email = new.email where id = new.id;
    exception when unique_violation then
      -- Another profile still holds this address; never block the auth change.
      raise warning 'profiles.email sync skipped for % (address already held)', new.id;
    end;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_profile_email_from_auth() from public;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email_from_auth();

-- One-time repair: profiles.email must equal the confirmed auth email.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and u.email is not null
   and p.email is distinct from u.email;
