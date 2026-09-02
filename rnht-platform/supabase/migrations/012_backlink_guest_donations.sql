-- Gap K (2026-09-01): a guest who donates and LATER creates an account never saw
-- those gifts in the dashboard or the self-service year-end PDF, because linking
-- only happened inside a new gift's completion path (donate verify / paypal
-- capture / manual entry). Link past guest gifts to a profile by normalized
-- email when the profile is created or its email changes, plus a one-time
-- backfill for existing rows. Idempotent; safe to re-run.

create or replace function public.backlink_guest_donations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;
  update public.donations d
     set user_id = new.id
   where d.user_id is null
     and lower(btrim(d.donor_email)) = lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists trg_profiles_backlink_donations on public.profiles;
create trigger trg_profiles_backlink_donations
  after insert or update of email on public.profiles
  for each row execute function public.backlink_guest_donations();

-- One-time backfill for gifts that predate this trigger. Only links when
-- exactly ONE profile has that email, so it can never guess between two.
update public.donations d
   set user_id = p.id
  from (
    select lower(btrim(email)) as norm, (min(id::text))::uuid as id
      from public.profiles
     where email is not null and btrim(email) <> ''
     group by lower(btrim(email))
    having count(*) = 1
  ) p
 where d.user_id is null
   and lower(btrim(d.donor_email)) = p.norm;
