-- Visitor counter for the admin dashboard (2026-09-02, Pandit ji request).
-- Privacy: stores only a random per-device key, the path and the platform.
-- No IP, no user agent, no user id. Clients cannot read or write the table
-- directly (RLS on, no policies); they call record_visit(), which is
-- SECURITY DEFINER and keeps at most one row per visitor per hour, and admins
-- read aggregates through visit_stats(). Idempotent; safe to re-run.

create table if not exists public.site_visits (
  id          bigint generated always as identity primary key,
  visited_at  timestamptz not null default now(),
  visitor_key text        not null,
  path        text        not null,
  platform    text        not null default 'web' check (platform in ('web', 'app'))
);
create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at);
create index if not exists site_visits_visitor_idx    on public.site_visits (visitor_key, visited_at);
alter table public.site_visits enable row level security;

-- Called by the site/app on the first page of a session. Silently ignores bad
-- input and admin pages, and dedupes to one row per visitor per hour.
create or replace function public.record_visit(p_visitor text, p_path text, p_platform text default 'web')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(p_visitor) < 8 or length(p_visitor) > 64 then return; end if;
  if p_path is null or length(p_path) = 0 or length(p_path) > 200 then return; end if;
  if p_path like '/admin%' then return; end if;
  if exists (
    select 1 from public.site_visits
     where visitor_key = p_visitor and visited_at > now() - interval '1 hour'
  ) then return; end if;
  insert into public.site_visits (visitor_key, path, platform)
  values (p_visitor, p_path, case when p_platform = 'app' then 'app' else 'web' end);
end;
$$;
revoke all on function public.record_visit(text, text, text) from public;
grant execute on function public.record_visit(text, text, text) to anon, authenticated;

-- Aggregates for the admin dashboard. Admins only.
create or replace function public.visit_stats()
returns table (
  today          bigint,
  last_7_days    bigint,
  last_30_days   bigint,
  all_time       bigint,
  unique_30_days bigint,
  app_30_days    bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  day_start timestamptz := (date_trunc('day', now() at time zone 'America/Chicago')) at time zone 'America/Chicago';
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.site_visits where visited_at >= day_start),
    (select count(*) from public.site_visits where visited_at >= now() - interval '7 days'),
    (select count(*) from public.site_visits where visited_at >= now() - interval '30 days'),
    (select count(*) from public.site_visits),
    (select count(distinct visitor_key) from public.site_visits where visited_at >= now() - interval '30 days'),
    (select count(*) from public.site_visits where platform = 'app' and visited_at >= now() - interval '30 days');
end;
$$;
revoke all on function public.visit_stats() from public;
-- Supabase's default privileges also grant EXECUTE to anon directly; revoke
-- that explicitly (the function refuses non-admins anyway).
revoke execute on function public.visit_stats() from anon;
grant execute on function public.visit_stats() to authenticated;
