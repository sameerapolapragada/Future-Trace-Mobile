-- Ensure retention cron jobs are registered (no CREATE EXTENSION — fixes SQLSTATE 2BP01).
-- Safe to re-run; replaces existing jobs with the same names.

begin;

do $cron$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed — enable in Supabase Dashboard; skipping cron setup';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'data-minimization-cleanup') then
    perform cron.unschedule('data-minimization-cleanup');
  end if;
  perform cron.schedule(
    'data-minimization-cleanup',
    '0 0 * * *',
    $$select public.cleanup_old_free_scans();$$
  );

  if to_regprocedure('public.cleanup_integration_staging_raw()') is not null then
    if exists (select 1 from cron.job where jobname = 'integration-staging-cleanup') then
      perform cron.unschedule('integration-staging-cleanup');
    end if;
    perform cron.schedule(
      'integration-staging-cleanup',
      '30 0 * * *',
      $$select public.cleanup_integration_staging_raw();$$
    );
  end if;

  if to_regprocedure('public.cleanup_old_llm_jobs()') is not null then
    if exists (select 1 from cron.job where jobname = 'llm-jobs-redaction-cleanup') then
      perform cron.unschedule('llm-jobs-redaction-cleanup');
    end if;
    perform cron.schedule(
      'llm-jobs-redaction-cleanup',
      '0 1 * * *',
      $$select public.cleanup_old_llm_jobs();$$
    );
  end if;
exception
  when undefined_table then
    raise notice 'cron.job not available — enable pg_cron extension';
  when undefined_function then
    raise notice 'cron.schedule not available — enable pg_cron extension';
end;
$cron$;

commit;
