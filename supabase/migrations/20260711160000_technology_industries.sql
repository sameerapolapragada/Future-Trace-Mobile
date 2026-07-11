-- Technology industries catalog with selection analytics (MVP picklist)
begin;

create table if not exists public.technology_industries (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  selection_count integer not null default 0 check (selection_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technology_industries_canonical_name_key unique (canonical_name)
);

create index if not exists technology_industries_active_name_idx
  on public.technology_industries (active, canonical_name);

create index if not exists technology_industries_selection_count_idx
  on public.technology_industries (selection_count desc);

drop trigger if exists technology_industries_updated_at on public.technology_industries;
create trigger technology_industries_updated_at
  before update on public.technology_industries
  for each row execute function public.set_updated_at();

-- Seed curated industries (idempotent)
insert into public.technology_industries (canonical_name) values
  ('Consulting'),
  ('Education'),
  ('Financial Services'),
  ('Government'),
  ('Healthcare'),
  ('Manufacturing'),
  ('Media & Entertainment'),
  ('Retail & E-commerce'),
  ('SaaS'),
  ('Technology')
on conflict (canonical_name) do update
  set active = true,
      updated_at = now();

alter table public.technology_industries enable row level security;
alter table public.technology_industries force row level security;

drop policy if exists "technology_industries_select_active" on public.technology_industries;
create policy "technology_industries_select_active"
  on public.technology_industries
  for select
  to anon, authenticated
  using (active = true);

-- Mutations go through record_technology_industry_selection (security definer).
create or replace function public.record_technology_industry_selection(
  p_canonical_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canonical text;
  v_matched text;
  v_count integer;
begin
  v_canonical := nullif(trim(coalesce(p_canonical_name, '')), '');
  if v_canonical is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_input');
  end if;

  update public.technology_industries
  set selection_count = selection_count + 1,
      updated_at = now()
  where lower(canonical_name) = lower(v_canonical)
    and active = true
  returning canonical_name, selection_count into v_matched, v_count;

  if v_matched is null then
    return jsonb_build_object('ok', false, 'reason', 'industry_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'canonical_name', v_matched,
    'selection_count', v_count
  );
end;
$$;

revoke all on function public.record_technology_industry_selection(text) from public;
grant execute on function public.record_technology_industry_selection(text) to anon, authenticated;

comment on table public.technology_industries is
  'Curated industries for MVP picklist; selection_count increments via record_technology_industry_selection.';

commit;
