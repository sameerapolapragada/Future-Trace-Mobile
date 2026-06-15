-- Drop Tier 1 + Tier 2 obsolete tables (see docs/OBSOLETE_DB_TABLES.md).
-- Keeps: milestones, industries (CI/radar refs), subscriptions, purchases, Tier 3+ tables.

begin;

-- ---------------------------------------------------------------------------
-- subscriptions: detach legacy plan_id before dropping plans
-- ---------------------------------------------------------------------------
alter table public.subscriptions add column if not exists product_key text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'plan_id'
  ) then
    update public.subscriptions
    set product_key = case plan_id
      when 'premium' then 'ai_career_transition_monthly'
      when 'free' then 'free'
      else coalesce(product_key, plan_id)
    end
    where product_key is null;

    alter table public.subscriptions drop constraint if exists subscriptions_plan_id_fkey;
    alter table public.subscriptions drop column plan_id;
  end if;
end $$;

alter table public.subscriptions
  alter column product_key set default 'ai_career_radar_monthly';

-- ---------------------------------------------------------------------------
-- Retention: ai_scan_history removed; cron alias delegates to career_scans only
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_old_free_scans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.cleanup_old_career_scans();
end;
$$;

revoke all on function public.cleanup_old_free_scans() from public;
grant execute on function public.cleanup_old_free_scans() to service_role;

-- ---------------------------------------------------------------------------
-- Tier 2 — superseded parallel designs
-- ---------------------------------------------------------------------------
drop table if exists public.user_sprint_progress cascade;
drop table if exists public.master_milestone_blueprints cascade;
drop table if exists public.roadmap_task_completions cascade;
drop table if exists public.user_resume_scans cascade;
drop table if exists public.user_career_profiles cascade;
drop table if exists public.user_skills cascade;

-- ---------------------------------------------------------------------------
-- Tier 1 — legacy / superseded
-- ---------------------------------------------------------------------------
drop table if exists public.career_xray_snapshots cascade;

do $$
begin
  if to_regclass('public.ai_scan_history') is not null then
    execute 'drop trigger if exists ai_scan_history_email_check on public.ai_scan_history';
  end if;
end $$;

drop function if exists public.enforce_scan_history_email_match();
drop table if exists public.ai_scan_history cascade;

drop table if exists public.user_profiles cascade;
drop function if exists public.handle_new_user();

-- Initial MVP editorial stack (retain public.milestones + public.industries)
drop table if exists public.user_recent_searches cascade;
drop table if exists public.search_topics cascade;
drop table if exists public.content_feed_items cascade;
drop table if exists public.exposure_scores cascade;
drop table if exists public.milestone_job_tags cascade;
drop table if exists public.milestone_industry_tags cascade;
drop table if exists public.milestone_sources cascade;
drop table if exists public.milestone_sections cascade;
drop table if exists public.milestone_display cascade;
drop table if exists public.score_jobs cascade;
drop table if exists public.job_exposure_examples cascade;
drop table if exists public.job_exposure_groups cascade;
drop table if exists public.industry_risks cascade;
drop table if exists public.app_metadata cascade;

drop table if exists public.web_dev_git_sync_log cascade;

drop table if exists public.plan_features cascade;
drop table if exists public.plans cascade;

commit;
