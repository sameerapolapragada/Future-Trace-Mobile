-- Smarter Role Matching: role_match_events, unknown_role_requests, career_scans extensions
begin;

-- ---------------------------------------------------------------------------
-- role_match_events
-- ---------------------------------------------------------------------------
create table if not exists public.role_match_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid references public.career_scans (id) on delete set null,

  original_role_input text not null,
  normalized_role text,
  role_family text,

  match_status text not null
    check (match_status in ('matched', 'partial_match', 'unsupported', 'no_match')),

  confidence_score numeric,
  confidence_label text
    check (confidence_label is null or confidence_label in ('excellent', 'high', 'medium', 'low', 'none')),

  suggested_roles_json jsonb,

  user_action text
    check (user_action is null or user_action in (
      'auto_accepted', 'confirmed', 'corrected', 'rejected',
      'needs_more_info', 'approximate_continue', 'abandoned'
    )),

  user_selected_role text,
  added_responsibilities text,
  added_tools text,
  added_industry text,

  needs_more_info boolean not null default false,
  analysis_quality text
    check (analysis_quality is null or analysis_quality in ('high', 'medium', 'low', 'none')),

  generic_result_flag boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists role_match_events_user_id_idx
  on public.role_match_events (user_id);

create index if not exists role_match_events_original_role_input_idx
  on public.role_match_events (original_role_input);

create index if not exists role_match_events_normalized_role_idx
  on public.role_match_events (normalized_role);

create index if not exists role_match_events_role_family_idx
  on public.role_match_events (role_family);

create index if not exists role_match_events_match_status_idx
  on public.role_match_events (match_status);

create index if not exists role_match_events_created_at_idx
  on public.role_match_events (created_at desc);

drop trigger if exists role_match_events_updated_at on public.role_match_events;
create trigger role_match_events_updated_at
  before update on public.role_match_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- unknown_role_requests
-- ---------------------------------------------------------------------------
create table if not exists public.unknown_role_requests (
  id uuid primary key default gen_random_uuid(),

  role_input text not null,
  normalized_role_input text not null,

  match_status text not null
    check (match_status in ('unsupported', 'no_match')),

  suggested_family text,
  example_user_id uuid references auth.users (id) on delete set null,

  times_requested integer not null default 1,

  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),

  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'supported', 'ignored')),

  admin_notes text,

  unique (normalized_role_input)
);

create index if not exists unknown_role_requests_normalized_idx
  on public.unknown_role_requests (normalized_role_input);

create index if not exists unknown_role_requests_times_requested_idx
  on public.unknown_role_requests (times_requested desc);

create index if not exists unknown_role_requests_status_idx
  on public.unknown_role_requests (status);

create index if not exists unknown_role_requests_last_seen_idx
  on public.unknown_role_requests (last_seen desc);

-- ---------------------------------------------------------------------------
-- career_scans role-match columns
-- ---------------------------------------------------------------------------
alter table public.career_scans
  add column if not exists role_match_event_id uuid references public.role_match_events (id) on delete set null,
  add column if not exists original_role_input text,
  add column if not exists normalized_current_role text,
  add column if not exists role_family text,
  add column if not exists role_match_confidence_score numeric,
  add column if not exists role_match_confidence_label text,
  add column if not exists role_match_status text,
  add column if not exists analysis_quality text;

create index if not exists career_scans_role_match_event_id_idx
  on public.career_scans (role_match_event_id);

-- ---------------------------------------------------------------------------
-- RLS: role_match_events — users manage own rows; service role bypasses RLS
-- ---------------------------------------------------------------------------
alter table public.role_match_events enable row level security;
alter table public.role_match_events force row level security;

drop policy if exists "role_match_events_select_own" on public.role_match_events;
create policy "role_match_events_select_own"
  on public.role_match_events for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "role_match_events_insert_own" on public.role_match_events;
create policy "role_match_events_insert_own"
  on public.role_match_events for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "role_match_events_update_own" on public.role_match_events;
create policy "role_match_events_update_own"
  on public.role_match_events for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RLS: unknown_role_requests — no direct user access
-- ---------------------------------------------------------------------------
alter table public.unknown_role_requests enable row level security;
alter table public.unknown_role_requests force row level security;

-- No policies for authenticated/anon — only service_role can access.

-- ---------------------------------------------------------------------------
-- Upsert helper for unknown role tracking (service role / edge function)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_unknown_role_request(
  p_role_input text,
  p_normalized_role_input text,
  p_match_status text,
  p_suggested_family text default null,
  p_example_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_match_status not in ('unsupported', 'no_match') then
    raise exception 'match_status must be unsupported or no_match';
  end if;

  insert into public.unknown_role_requests (
    role_input,
    normalized_role_input,
    match_status,
    suggested_family,
    example_user_id,
    times_requested,
    first_seen,
    last_seen,
    status
  )
  values (
    p_role_input,
    p_normalized_role_input,
    p_match_status,
    p_suggested_family,
    p_example_user_id,
    1,
    now(),
    now(),
    'pending'
  )
  on conflict (normalized_role_input) do update
    set
      times_requested = public.unknown_role_requests.times_requested + 1,
      last_seen = now(),
      match_status = excluded.match_status,
      suggested_family = coalesce(excluded.suggested_family, public.unknown_role_requests.suggested_family);
end;
$$;

revoke all on function public.upsert_unknown_role_request(text, text, text, text, uuid) from public;
revoke all on function public.upsert_unknown_role_request(text, text, text, text, uuid) from anon;
revoke all on function public.upsert_unknown_role_request(text, text, text, text, uuid) from authenticated;
grant execute on function public.upsert_unknown_role_request(text, text, text, text, uuid) to service_role;

commit;
