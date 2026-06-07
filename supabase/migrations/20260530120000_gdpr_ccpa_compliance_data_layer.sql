-- =============================================================================
-- GDPR / CCPA compliant data layer (profiles, ai_scan_history, compliance_logs)
-- Run via: Supabase SQL Editor, or `supabase db push` on linked branch.
--
-- Principles:
--   • Data minimization — automated purge of free-tier scans > 30 days
--   • Right to be forgotten — ON DELETE CASCADE from auth.users → profiles → scans
--   • Least privilege — FORCE RLS; users only touch their own rows
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Extensions & shared helpers
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tear down legacy objects (safe on empty DB — tables may not exist yet)
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user();
drop function if exists public.handle_new_user_signup();
drop function if exists public.enforce_scan_history_email_match();
drop function if exists public.cleanup_old_free_scans();

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles' and c.relkind = 'r'
  ) then
    execute 'drop trigger if exists profiles_updated_at on public.profiles';
    drop policy if exists "profiles_select_own" on public.profiles;
    drop policy if exists "profiles_update_own" on public.profiles;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'ai_scan_history' and c.relkind = 'r'
  ) then
    execute 'drop trigger if exists ai_scan_history_email_check on public.ai_scan_history';
    drop policy if exists "ai_scan_history_select_own" on public.ai_scan_history;
    drop policy if exists "ai_scan_history_insert_own" on public.ai_scan_history;
    drop policy if exists "ai_scan_history_update_own" on public.ai_scan_history;
    drop policy if exists "ai_scan_history_delete_own" on public.ai_scan_history;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'compliance_logs' and c.relkind = 'r'
  ) then
    drop policy if exists "compliance_logs_insert_own" on public.compliance_logs;
  end if;
end $$;

-- Optional: uncomment ONLY on empty dev databases to fully reset app tables
-- drop table if exists public.ai_scan_history cascade;
-- drop table if exists public.compliance_logs cascade;
-- drop table if exists public.profiles cascade;

-- -----------------------------------------------------------------------------
-- Table 1: profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  job_role text,
  is_premium boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Align columns when upgrading from an older profiles definition
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists job_role text;
alter table public.profiles add column if not exists is_premium boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table 2: ai_scan_history (resume PII)
-- -----------------------------------------------------------------------------
create table if not exists public.ai_scan_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  resume_text text not null,
  overall_score integer not null,
  free_summary text,
  created_at timestamptz not null default now()
);

alter table public.ai_scan_history add column if not exists free_summary text;
alter table public.ai_scan_history add column if not exists overall_score integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ai_scan_history'
      and column_name = 'overall_score'
      and is_nullable = 'YES'
  ) then
    update public.ai_scan_history set overall_score = 0 where overall_score is null;
    alter table public.ai_scan_history alter column overall_score set not null;
  end if;
end $$;

create index if not exists ai_scan_history_created_at_idx
  on public.ai_scan_history (created_at);

create index if not exists ai_scan_history_profile_created_idx
  on public.ai_scan_history (profile_id, created_at desc);

-- Email on each scan must match the owning profile (validation / minimization guard)
create or replace function public.enforce_scan_history_email_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and lower(p.email) = lower(new.email)
  ) then
    raise exception 'ai_scan_history.email must match the profile owner email';
  end if;

  return new;
end;
$$;

drop trigger if exists ai_scan_history_email_check on public.ai_scan_history;
create trigger ai_scan_history_email_check
  before insert or update on public.ai_scan_history
  for each row execute function public.enforce_scan_history_email_match();

-- -----------------------------------------------------------------------------
-- Table 3: compliance_logs (immutable audit trail)
-- target_profile_id intentionally has NO FK — logs survive profile erasure
-- -----------------------------------------------------------------------------
create table if not exists public.compliance_logs (
  id uuid primary key default gen_random_uuid(),
  action_performed text not null,
  target_profile_id uuid,
  timestamp timestamptz not null default now()
);

create index if not exists compliance_logs_target_ts_idx
  on public.compliance_logs (target_profile_id, timestamp desc);

create index if not exists compliance_logs_action_ts_idx
  on public.compliance_logs (action_performed, timestamp desc);

-- -----------------------------------------------------------------------------
-- 1. Secure automated account initialization (auth.users → profiles)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
begin
  meta_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );

  insert into public.profiles (id, email, full_name, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(meta_name), ''),
    now()
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = now();

  insert into public.compliance_logs (action_performed, target_profile_id)
  values ('ACCOUNT_CREATED', new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

-- -----------------------------------------------------------------------------
-- 2. Data minimization — purge free-tier scans older than 30 days
-- -----------------------------------------------------------------------------
create or replace function public.cleanup_old_free_scans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  with doomed as (
    select h.id
    from public.ai_scan_history h
    inner join public.profiles p on p.id = h.profile_id
    where p.is_premium = false
      and h.created_at < (now() - interval '30 days')
  )
  delete from public.ai_scan_history h
  using doomed d
  where h.id = d.id;

  get diagnostics deleted_count = row_count;

  if deleted_count > 0 then
    insert into public.compliance_logs (action_performed, target_profile_id)
    values (
      format('DATA_MINIMIZATION_PURGE:%s_ROWS', deleted_count),
      null
    );
  end if;

  return deleted_count;
end;
$$;

revoke all on function public.cleanup_old_free_scans() from public;
grant execute on function public.cleanup_old_free_scans() to service_role;

-- Scheduler: see migration 20260601120000_schedule_data_minimization_cron.sql
-- (job name data-minimization-cleanup, nightly at 00:00 UTC)

-- -----------------------------------------------------------------------------
-- Client helper — log user-initiated compliance events (export, deletion request)
-- -----------------------------------------------------------------------------
create or replace function public.log_compliance_event(p_action text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  log_id uuid;
begin
  if actor is null then
    raise exception 'not authenticated';
  end if;

  if p_action is null or length(trim(p_action)) = 0 then
    raise exception 'action_performed is required';
  end if;

  insert into public.compliance_logs (action_performed, target_profile_id)
  values (trim(p_action), actor)
  returning id into log_id;

  return log_id;
end;
$$;

revoke all on function public.log_compliance_event(text) from public;
grant execute on function public.log_compliance_event(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Row Level Security — FORCE (least privilege, no bypass for table owners)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.ai_scan_history enable row level security;
alter table public.ai_scan_history force row level security;

alter table public.compliance_logs enable row level security;
alter table public.compliance_logs force row level security;

-- profiles: SELECT + UPDATE own row only (no INSERT — created by trigger)
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ai_scan_history: SELECT + INSERT own rows only (immutable — no UPDATE/DELETE for clients)
create policy "ai_scan_history_select_own"
  on public.ai_scan_history
  for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "ai_scan_history_insert_own"
  on public.ai_scan_history
  for insert
  to authenticated
  with check (
    auth.uid() = profile_id
    and email = (select p.email from public.profiles p where p.id = auth.uid())
  );

-- compliance_logs: INSERT-only for authenticated users (own profile id only)
create policy "compliance_logs_insert_own"
  on public.compliance_logs
  for insert
  to authenticated
  with check (
    target_profile_id is null
    or target_profile_id = auth.uid()
  );

-- No SELECT / UPDATE / DELETE policies on compliance_logs for authenticated role
-- (audit immutability for end-user clients; operators use service_role in dashboard)

commit;
