-- Future Trace Mobile — compliance, RLS, triggers, retention jobs
-- Implements docs/DATABASE_DESIGN.md §14

begin;

-- ---------------------------------------------------------------------------
-- Signup: profiles + entitlements + compliance log
-- ---------------------------------------------------------------------------
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

  insert into public.profiles (id, email, display_name, full_name, updated_at)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(trim(meta_name), ''),
    nullif(trim(meta_name), ''),
    now()
  )
  on conflict (id) do update
    set
      email = excluded.email,
      display_name = coalesce(excluded.display_name, public.profiles.display_name),
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = now();

  insert into public.user_entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.compliance_logs (action_performed, target_profile_id)
  values ('ACCOUNT_CREATED', new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

-- ---------------------------------------------------------------------------
-- Scan ownership: user_id on career_scans must match auth session
-- ---------------------------------------------------------------------------
create or replace function public.enforce_career_scan_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if new.user_id <> auth.uid() then
    raise exception 'career_scans.user_id must match authenticated user';
  end if;

  return new;
end;
$$;

drop trigger if exists career_scans_owner_check on public.career_scans;
create trigger career_scans_owner_check
  before insert on public.career_scans
  for each row execute function public.enforce_career_scan_owner();

create or replace function public.enforce_scan_input_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  scan_owner uuid;
begin
  select cs.user_id into scan_owner
  from public.career_scans cs
  where cs.id = new.scan_id;

  if scan_owner is null then
    raise exception 'scan_id does not exist';
  end if;

  if auth.uid() is not null and scan_owner <> auth.uid() then
    raise exception 'scan_inputs must belong to the authenticated user scan';
  end if;

  return new;
end;
$$;

drop trigger if exists scan_inputs_owner_check on public.scan_inputs;
create trigger scan_inputs_owner_check
  before insert on public.scan_inputs
  for each row execute function public.enforce_scan_input_owner();

-- ---------------------------------------------------------------------------
-- Compliance RPC (export / deletion audit)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Data minimization: free-tier career scans (30 days)
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_old_career_scans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  with doomed as (
    select cs.id
    from public.career_scans cs
    inner join public.user_entitlements ue on ue.user_id = cs.user_id
    where ue.has_career_xray = false
      and ue.has_radar = false
      and cs.created_at < (now() - interval '30 days')
  )
  delete from public.career_scans cs
  using doomed d
  where cs.id = d.id;

  get diagnostics deleted_count = row_count;

  if deleted_count > 0 then
    insert into public.compliance_logs (action_performed, target_profile_id)
    values (format('DATA_MINIMIZATION_PURGE_CAREER_SCANS:%s_ROWS', deleted_count), null);
  end if;

  return deleted_count;
end;
$$;

revoke all on function public.cleanup_old_career_scans() from public;
grant execute on function public.cleanup_old_career_scans() to service_role;

-- Legacy name alias for existing cron compatibility
create or replace function public.cleanup_old_free_scans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  legacy_deleted integer := 0;
  career_deleted integer := 0;
begin
  if to_regclass('public.ai_scan_history') is not null then
    execute $sql$
      with doomed as (
        select h.id
        from public.ai_scan_history h
        inner join public.profiles p on p.id = h.profile_id
        where coalesce(p.is_premium, false) = false
          and h.created_at < (now() - interval '30 days')
      )
      delete from public.ai_scan_history h
      using doomed d
      where h.id = d.id
    $sql$;
    get diagnostics legacy_deleted = row_count;
  end if;

  career_deleted := public.cleanup_old_career_scans();
  return legacy_deleted + career_deleted;
end;
$$;

revoke all on function public.cleanup_old_free_scans() from public;
grant execute on function public.cleanup_old_free_scans() to service_role;

-- Staging raw retention (30 days)
create or replace function public.cleanup_integration_staging_raw()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.integration_staging_raw
  where fetched_at < (now() - interval '30 days');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_integration_staging_raw() from public;
grant execute on function public.cleanup_integration_staging_raw() to service_role;

-- LLM debug response retention (90 days)
create or replace function public.cleanup_old_llm_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.llm_jobs
  set raw_response = null
  where created_at < (now() - interval '90 days')
    and raw_response is not null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.cleanup_old_llm_jobs() from public;
grant execute on function public.cleanup_old_llm_jobs() to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- profiles
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_career_profiles
alter table public.user_career_profiles enable row level security;
alter table public.user_career_profiles force row level security;

drop policy if exists "user_career_profiles_select_own" on public.user_career_profiles;
create policy "user_career_profiles_select_own"
  on public.user_career_profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_career_profiles_insert_own" on public.user_career_profiles;
create policy "user_career_profiles_insert_own"
  on public.user_career_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_career_profiles_update_own" on public.user_career_profiles;
create policy "user_career_profiles_update_own"
  on public.user_career_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_skills
alter table public.user_skills enable row level security;
alter table public.user_skills force row level security;

drop policy if exists "user_skills_select_own" on public.user_skills;
create policy "user_skills_select_own"
  on public.user_skills for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_skills_insert_own" on public.user_skills;
create policy "user_skills_insert_own"
  on public.user_skills for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_skills_update_own" on public.user_skills;
create policy "user_skills_update_own"
  on public.user_skills for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_skills_delete_own" on public.user_skills;
create policy "user_skills_delete_own"
  on public.user_skills for delete to authenticated
  using (auth.uid() = user_id);

-- user_entitlements (read-only for clients)
alter table public.user_entitlements enable row level security;
alter table public.user_entitlements force row level security;

drop policy if exists "user_entitlements_select_own" on public.user_entitlements;
create policy "user_entitlements_select_own"
  on public.user_entitlements for select to authenticated
  using (auth.uid() = user_id);

-- purchases
alter table public.purchases enable row level security;
alter table public.purchases force row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select to authenticated
  using (auth.uid() = user_id);

-- user_subscriptions
alter table public.user_subscriptions enable row level security;
alter table public.user_subscriptions force row level security;

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own"
  on public.user_subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- user_consents
alter table public.user_consents enable row level security;
alter table public.user_consents force row level security;

drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own"
  on public.user_consents for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_consents_insert_own" on public.user_consents;
create policy "user_consents_insert_own"
  on public.user_consents for insert to authenticated
  with check (auth.uid() = user_id);

-- career_scans (immutable for clients)
alter table public.career_scans enable row level security;
alter table public.career_scans force row level security;

drop policy if exists "career_scans_select_own" on public.career_scans;
create policy "career_scans_select_own"
  on public.career_scans for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "career_scans_insert_own" on public.career_scans;
create policy "career_scans_insert_own"
  on public.career_scans for insert to authenticated
  with check (auth.uid() = user_id);

-- scan_inputs + scan breakdown tables
alter table public.scan_inputs enable row level security;
alter table public.scan_inputs force row level security;

drop policy if exists "scan_inputs_select_own" on public.scan_inputs;
create policy "scan_inputs_select_own"
  on public.scan_inputs for select to authenticated
  using (
    exists (
      select 1 from public.career_scans cs
      where cs.id = scan_inputs.scan_id and cs.user_id = auth.uid()
    )
  );

drop policy if exists "scan_inputs_insert_own" on public.scan_inputs;
create policy "scan_inputs_insert_own"
  on public.scan_inputs for insert to authenticated
  with check (
    exists (
      select 1 from public.career_scans cs
      where cs.id = scan_inputs.scan_id and cs.user_id = auth.uid()
    )
  );

-- Helper macro pattern for scan child tables
do $rls$
declare
  tbl text;
begin
  foreach tbl in array array[
    'scan_strengths',
    'scan_vulnerabilities',
    'scan_opportunity_zones',
    'scan_transition_role_suggestions',
    'scan_generation_context'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('alter table public.%I force row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (
          select 1 from public.career_scans cs
          where cs.id = %I.scan_id and cs.user_id = auth.uid()
        )
      )',
      tbl || '_select_own',
      tbl,
      tbl
    );
    execute format('drop policy if exists %I on public.%I', tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (
        exists (
          select 1 from public.career_scans cs
          where cs.id = %I.scan_id and cs.user_id = auth.uid()
        )
      )',
      tbl || '_insert_own',
      tbl,
      tbl
    );
  end loop;
end;
$rls$;

-- xray_reports
alter table public.xray_reports enable row level security;
alter table public.xray_reports force row level security;

drop policy if exists "xray_reports_select_own" on public.xray_reports;
create policy "xray_reports_select_own"
  on public.xray_reports for select to authenticated
  using (auth.uid() = user_id);

-- xray child tables
do $rls$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('xray_skill_gaps', 'xray_report_id'),
      ('xray_transition_matches', 'xray_report_id')
    ) as t(child_table, fk_col)
  loop
    execute format('alter table public.%I enable row level security', rec.child_table);
    execute format('alter table public.%I force row level security', rec.child_table);
    execute format('drop policy if exists %I on public.%I', rec.child_table || '_select_own', rec.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (
          select 1 from public.xray_reports xr
          where xr.id = %I.%I and xr.user_id = auth.uid()
        )
      )',
      rec.child_table || '_select_own',
      rec.child_table,
      rec.child_table,
      rec.fk_col
    );
  end loop;
end;
$rls$;

-- role_intelligence_reports
alter table public.role_intelligence_reports enable row level security;
alter table public.role_intelligence_reports force row level security;

drop policy if exists "role_intelligence_reports_select_own" on public.role_intelligence_reports;
create policy "role_intelligence_reports_select_own"
  on public.role_intelligence_reports for select to authenticated
  using (user_id is null or auth.uid() = user_id);

-- radar_snapshots
alter table public.radar_snapshots enable row level security;
alter table public.radar_snapshots force row level security;

drop policy if exists "radar_snapshots_select_own" on public.radar_snapshots;
create policy "radar_snapshots_select_own"
  on public.radar_snapshots for select to authenticated
  using (auth.uid() = user_id);

-- radar child tables
do $rls$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('radar_sub_metrics', 'snapshot_id', 'radar_snapshots'),
      ('radar_skill_gap_progress', 'snapshot_id', 'radar_snapshots'),
      ('radar_insight_items', 'snapshot_id', 'radar_snapshots')
    ) as t(child_table, fk_col, parent_table)
  loop
    execute format('alter table public.%I enable row level security', rec.child_table);
    execute format('alter table public.%I force row level security', rec.child_table);
    execute format('drop policy if exists %I on public.%I', rec.child_table || '_select_own', rec.child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (
          select 1 from public.%I rs
          where rs.id = %I.%I and rs.user_id = auth.uid()
        )
      )',
      rec.child_table || '_select_own',
      rec.child_table,
      rec.parent_table,
      rec.child_table,
      rec.fk_col
    );
  end loop;
end;
$rls$;

-- radar_signals (user-specific or global)
alter table public.radar_signals enable row level security;
alter table public.radar_signals force row level security;

drop policy if exists "radar_signals_select_own_or_global" on public.radar_signals;
create policy "radar_signals_select_own_or_global"
  on public.radar_signals for select to authenticated
  using (user_id is null or auth.uid() = user_id);

-- radar_monthly_diffs
alter table public.radar_monthly_diffs enable row level security;
alter table public.radar_monthly_diffs force row level security;

drop policy if exists "radar_monthly_diffs_select_own" on public.radar_monthly_diffs;
create policy "radar_monthly_diffs_select_own"
  on public.radar_monthly_diffs for select to authenticated
  using (auth.uid() = user_id);

-- compliance_logs (insert-only for users)
alter table public.compliance_logs enable row level security;
alter table public.compliance_logs force row level security;

drop policy if exists "compliance_logs_insert_own" on public.compliance_logs;
create policy "compliance_logs_insert_own"
  on public.compliance_logs for insert to authenticated
  with check (target_profile_id is null or target_profile_id = auth.uid());

-- Public read: reference catalog
do $rls$
declare
  tbl text;
begin
  foreach tbl in array array[
    'domains',
    'industries',
    'occupation_roles',
    'role_aliases',
    'skills',
    'role_skills',
    'role_adjacency',
    'milestones',
    'ai_evolution_eras',
    'products',
    'geo_markets',
    'role_salary_benchmarks',
    'market_signals',
    'market_snapshots',
    'role_evolution_timeline'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_read_all', tbl);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      tbl || '_read_all',
      tbl
    );
  end loop;
end;
$rls$;

-- Service-only tables: enable RLS with no policies for anon/authenticated
alter table public.salary_observations enable row level security;
alter table public.role_demand_observations enable row level security;
alter table public.skill_momentum_observations enable row level security;
alter table public.role_ai_exposure_snapshots enable row level security;
alter table public.role_demand_ai_adjustments enable row level security;
alter table public.role_salary_ai_adjustments enable row level security;
alter table public.llm_jobs enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.integration_sync_jobs enable row level security;
alter table public.integration_sync_runs enable row level security;
alter table public.integration_staging_raw enable row level security;
alter table public.content_cache enable row level security;
alter table public.data_sources enable row level security;
alter table public.title_normalization_requests enable row level security;
alter table public.scan_rate_limits enable row level security;
alter table public.analytics_career_scan_aggregates enable row level security;

commit;
