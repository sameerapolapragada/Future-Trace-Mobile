-- Schedule retention cron jobs (integration staging + LLM redaction)
-- pg_cron is pre-installed on Supabase hosted — do not CREATE EXTENSION (SQLSTATE 2BP01).

begin;

do $cron$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed — enable in Supabase Dashboard; skipping cron setup';
    return;
  end if;

  -- Refresh data-minimization job (function now includes career_scans)
  if exists (select 1 from cron.job where jobname = 'data-minimization-cleanup') then
    perform cron.unschedule('data-minimization-cleanup');
  end if;
  perform cron.schedule(
    'data-minimization-cleanup',
    '0 0 * * *',
    $$select public.cleanup_old_free_scans();$$
  );

  if exists (select 1 from cron.job where jobname = 'integration-staging-cleanup') then
    perform cron.unschedule('integration-staging-cleanup');
  end if;
  perform cron.schedule(
    'integration-staging-cleanup',
    '30 0 * * *',
    $$select public.cleanup_integration_staging_raw();$$
  );

  if exists (select 1 from cron.job where jobname = 'llm-jobs-redaction-cleanup') then
    perform cron.unschedule('llm-jobs-redaction-cleanup');
  end if;
  perform cron.schedule(
    'llm-jobs-redaction-cleanup',
    '0 1 * * *',
    $$select public.cleanup_old_llm_jobs();$$
  );
exception
  when undefined_table then
    raise notice 'pg_cron cron.job not available — enable pg_cron extension, then re-apply';
  when undefined_function then
    raise notice 'cron.schedule not available — enable pg_cron extension, then re-apply';
end;
$cron$;

commit;
