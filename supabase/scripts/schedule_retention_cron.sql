-- Idempotent pg_cron job registration (Supabase hosted safe — no CREATE EXTENSION).
-- Run this if migrations 20260601120000 / 20260605120200 failed with SQLSTATE 2BP01,
-- or to register jobs manually from SQL Editor.

do $cron$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable pg_cron: Dashboard → Database → Extensions → pg_cron';
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
end;
$cron$;

-- Verify
select jobname, schedule, active
from cron.job
where jobname like '%cleanup%'
order by jobname;
