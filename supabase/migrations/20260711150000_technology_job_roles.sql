-- Technology job roles catalog with selection analytics (MVP picklist)
begin;

create table if not exists public.technology_job_roles (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  family text,
  selection_count integer not null default 0 check (selection_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technology_job_roles_canonical_name_key unique (canonical_name)
);

create index if not exists technology_job_roles_active_name_idx
  on public.technology_job_roles (active, canonical_name);

create index if not exists technology_job_roles_selection_count_idx
  on public.technology_job_roles (selection_count desc);

drop trigger if exists technology_job_roles_updated_at on public.technology_job_roles;
create trigger technology_job_roles_updated_at
  before update on public.technology_job_roles
  for each row execute function public.set_updated_at();

-- Free-text "Other" role submissions that did not map to a catalog role
create table if not exists public.technology_job_role_other_requests (
  id uuid primary key default gen_random_uuid(),
  role_input text not null,
  normalized_role_input text not null,
  times_requested integer not null default 1 check (times_requested >= 1),
  matched_canonical text references public.technology_job_roles (canonical_name) on delete set null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  constraint technology_job_role_other_requests_normalized_key unique (normalized_role_input)
);

create index if not exists technology_job_role_other_requests_times_idx
  on public.technology_job_role_other_requests (times_requested desc);

create index if not exists technology_job_role_other_requests_last_seen_idx
  on public.technology_job_role_other_requests (last_seen desc);

-- Seed curated technology roles (idempotent)
insert into public.technology_job_roles (canonical_name, family) values
  ('Backend Developer', 'Software Engineering'),
  ('Business Analyst', 'Business & Strategy'),
  ('Cloud Engineer', 'Software Engineering'),
  ('Customer Success Manager', 'Customer Success'),
  ('Customer Support Specialist', 'Customer Success'),
  ('Cybersecurity Analyst', 'Security'),
  ('Data Analyst', 'Data & Analytics'),
  ('Data Scientist', 'Data & Analytics'),
  ('Database Administrator', 'Data & Analytics'),
  ('DevOps Engineer', 'Software Engineering'),
  ('Frontend Developer', 'Software Engineering'),
  ('Full Stack Developer', 'Software Engineering'),
  ('IT Support Specialist', 'IT Operations'),
  ('Mobile Developer', 'Software Engineering'),
  ('Platform Engineer', 'Software Engineering'),
  ('Product Manager', 'Product'),
  ('Project Manager', 'Program & Project Management'),
  ('QA Analyst', 'Quality & Testing'),
  ('RevOps Analyst', 'Revenue Operations'),
  ('Salesforce Administrator', 'Salesforce'),
  ('Salesforce Business Analyst', 'Salesforce'),
  ('Salesforce Consultant', 'Salesforce'),
  ('Salesforce Developer', 'Salesforce'),
  ('Salesforce Solution Architect', 'Salesforce'),
  ('Scrum Master', 'Program & Project Management'),
  ('Software Developer', 'Software Engineering'),
  ('Solutions Architect', 'Software Engineering'),
  ('Systems Administrator', 'IT Operations'),
  ('Technical Writer', 'Product'),
  ('UX Designer', 'Design')
on conflict (canonical_name) do update
  set family = excluded.family,
      active = true,
      updated_at = now();

alter table public.technology_job_roles enable row level security;
alter table public.technology_job_roles force row level security;
alter table public.technology_job_role_other_requests enable row level security;
alter table public.technology_job_role_other_requests force row level security;

drop policy if exists "technology_job_roles_select_active" on public.technology_job_roles;
create policy "technology_job_roles_select_active"
  on public.technology_job_roles
  for select
  to anon, authenticated
  using (active = true);

-- No client insert/update/delete policies on either table (default deny under RLS).
-- Mutations go through record_technology_job_role_selection (security definer).

create or replace function public.record_technology_job_role_selection(
  p_canonical_name text default null,
  p_other_role_input text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canonical text;
  v_other text;
  v_normalized text;
  v_matched text;
  v_count integer;
begin
  v_canonical := nullif(trim(coalesce(p_canonical_name, '')), '');
  v_other := nullif(trim(coalesce(p_other_role_input, '')), '');

  if v_canonical is not null then
    update public.technology_job_roles
    set selection_count = selection_count + 1,
        updated_at = now()
    where lower(canonical_name) = lower(v_canonical)
      and active = true
    returning canonical_name, selection_count into v_matched, v_count;

    if v_matched is null then
      return jsonb_build_object('ok', false, 'reason', 'role_not_found');
    end if;

    if v_other is not null then
      v_normalized := lower(regexp_replace(v_other, '\s+', ' ', 'g'));
      insert into public.technology_job_role_other_requests (
        role_input, normalized_role_input, times_requested, matched_canonical, first_seen, last_seen
      ) values (
        v_other, v_normalized, 1, v_matched, now(), now()
      )
      on conflict (normalized_role_input) do update
        set times_requested = public.technology_job_role_other_requests.times_requested + 1,
            matched_canonical = coalesce(excluded.matched_canonical, public.technology_job_role_other_requests.matched_canonical),
            last_seen = now();
    end if;

    return jsonb_build_object(
      'ok', true,
      'canonical_name', v_matched,
      'selection_count', v_count,
      'other_recorded', v_other is not null
    );
  end if;

  if v_other is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_input');
  end if;

  v_normalized := lower(regexp_replace(v_other, '\s+', ' ', 'g'));
  insert into public.technology_job_role_other_requests (
    role_input, normalized_role_input, times_requested, matched_canonical, first_seen, last_seen
  ) values (
    v_other, v_normalized, 1, null, now(), now()
  )
  on conflict (normalized_role_input) do update
    set times_requested = public.technology_job_role_other_requests.times_requested + 1,
        last_seen = now()
  returning times_requested into v_count;

  return jsonb_build_object(
    'ok', true,
    'other_recorded', true,
    'times_requested', v_count
  );
end;
$$;

revoke all on function public.record_technology_job_role_selection(text, text) from public;
grant execute on function public.record_technology_job_role_selection(text, text) to anon, authenticated;

comment on table public.technology_job_roles is
  'Curated technology job roles for MVP picklist; selection_count increments via record_technology_job_role_selection.';

comment on table public.technology_job_role_other_requests is
  'Free-text roles entered via Other; unmatched or mapped to a catalog role for product analytics.';

commit;
