-- 017: flood guard for record_visit (QA 2026-09-02). The per-visitor hourly
-- dedupe cannot stop a caller that invents a new visitor key per request, so
-- cap what the whole site can record per minute. Real traffic is nowhere near
-- 240 new visitors/minute; a flood simply stops being counted. Idempotent.
create or replace function public.record_visit(p_visitor text, p_path text, p_platform text default 'web')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(p_visitor) < 8 or length(p_visitor) > 64 then return; end if;
  if p_path is null or length(p_path) = 0 or length(p_path) > 200 then return; end if;
  if lower(p_path) like '/admin%' then return; end if;
  if exists (
    select 1 from public.site_visits
     where visitor_key = p_visitor and visited_at > now() - interval '1 hour'
  ) then return; end if;
  if (select count(*) from public.site_visits where visited_at > now() - interval '1 minute') >= 240 then
    return;
  end if;
  insert into public.site_visits (visitor_key, path, platform)
  values (p_visitor, p_path, case when p_platform = 'app' then 'app' else 'web' end);
end;
$$;
