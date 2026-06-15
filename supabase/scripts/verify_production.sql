-- Future Trace — production readiness verification
-- Run in Supabase SQL Editor or: supabase db query --linked -f supabase/scripts/verify_production.sql

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
select 'pg_cron' as check_name,
  case when exists (select 1 from pg_extension where extname = 'pg_cron')
    then 'PASS' else 'FAIL — enable in Dashboard → Database → Extensions' end as status;

-- ---------------------------------------------------------------------------
-- 2. Cron jobs (expect 4 active)
-- ---------------------------------------------------------------------------
select jobname, schedule, active,
  case when active then 'PASS' else 'FAIL' end as status
from cron.job
where jobname in (
  'data-minimization-cleanup',
  'integration-staging-cleanup',
  'llm-jobs-redaction-cleanup',
  'monthly-career-plan-refresh'
)
order by jobname;

-- ---------------------------------------------------------------------------
-- 3. Signup trigger
-- ---------------------------------------------------------------------------
select tgname, tgrelid::regclass as on_table,
  case when tgname = 'on_auth_user_created' then 'PASS' else 'FAIL' end as status
from pg_trigger
where tgname = 'on_auth_user_created';

-- ---------------------------------------------------------------------------
-- 4. Signup side-effect parity (profiles + entitlements per auth user)
-- ---------------------------------------------------------------------------
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_entitlements) as entitlements,
  case
    when (select count(*) from auth.users) = (select count(*) from public.profiles)
     and (select count(*) from auth.users) = (select count(*) from public.user_entitlements)
    then 'PASS'
    else 'WARN — counts differ; check handle_new_user_signup trigger'
  end as status;

-- ---------------------------------------------------------------------------
-- 5. RLS on user-owned tables (expect rls_enabled + rls_forced = true)
-- ---------------------------------------------------------------------------
select c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  case when c.relrowsecurity and c.relforcerowsecurity then 'PASS' else 'FAIL' end as status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in (
    'profiles', 'user_entitlements', 'career_scans', 'career_xrays',
    'career_goals', 'weekly_milestones', 'milestone_tasks',
    'subscription_usage', 'usage_limits', 'plan_update_recommendations',
    'purchases', 'subscriptions', 'scan_inputs'
  )
order by c.relname;

-- ---------------------------------------------------------------------------
-- 6. Internal RPCs not callable by anon (post 20260610710000)
-- ---------------------------------------------------------------------------
select p.proname,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  case when not has_function_privilege('anon', p.oid, 'EXECUTE') then 'PASS' else 'FAIL' end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like '\_%'
order by p.proname;

-- ---------------------------------------------------------------------------
-- 7. Core catalog tables readable (products seeded)
-- ---------------------------------------------------------------------------
select id, stripe_price_id,
  case when stripe_price_id is not null then 'PASS' else 'WARN — set live price ID before launch' end as status
from public.products
order by id;

-- ---------------------------------------------------------------------------
-- 8. Migration version (latest applied)
-- ---------------------------------------------------------------------------
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 5;
