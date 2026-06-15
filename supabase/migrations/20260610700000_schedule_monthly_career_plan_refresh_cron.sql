-- Schedule monthly_career_plan_refresh via pg_cron (1st of month, 03:00 UTC).
-- Function defined in 20260610400000_adaptive_plan_updates.sql; service_role only.

begin;

do $cron$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed — enable in Supabase Dashboard; skipping monthly plan refresh cron';
    return;
  end if;

  if to_regprocedure('public.monthly_career_plan_refresh()') is null then
    raise notice 'monthly_career_plan_refresh() not found — apply 20260610400000 first';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'monthly-career-plan-refresh') then
    perform cron.unschedule('monthly-career-plan-refresh');
  end if;

  perform cron.schedule(
    'monthly-career-plan-refresh',
    '0 3 1 * *',
    $$select public.monthly_career_plan_refresh();$$
  );
exception
  when undefined_table then
    raise notice 'cron.job not available — enable pg_cron extension';
  when undefined_function then
    raise notice 'cron.schedule not available — enable pg_cron extension';
end;
$cron$;

commit;
