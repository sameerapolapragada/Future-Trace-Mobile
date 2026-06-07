-- Schedule nightly data minimization and retention jobs (pg_cron)
-- Requires pg_cron extension (Supabase Dashboard → Database → Extensions)

begin;

create extension if not exists pg_cron with schema extensions;

grant usage on schema cron to postgres;

do $cron$
begin
  if exists (select 1 from cron.job where jobname = 'data-minimization-cleanup') then
    perform cron.unschedule('data-minimization-cleanup');
  end if;
  if exists (select 1 from cron.job where jobname = 'integration-staging-cleanup') then
    perform cron.unschedule('integration-staging-cleanup');
  end if;
  if exists (select 1 from cron.job where jobname = 'llm-jobs-redaction-cleanup') then
    perform cron.unschedule('llm-jobs-redaction-cleanup');
  end if;
exception
  when undefined_table then
    raise notice 'pg_cron not available — skip scheduling; run cleanup functions manually';
  when undefined_function then
    raise notice 'pg_cron not available — skip scheduling';
end;
$cron$;

-- Free-tier scan purge + legacy ai_scan_history (midnight UTC)
select cron.schedule(
  'data-minimization-cleanup',
  '0 0 * * *',
  $$select public.cleanup_old_free_scans();$$
);

-- Integration staging purge (00:30 UTC)
select cron.schedule(
  'integration-staging-cleanup',
  '30 0 * * *',
  $$select public.cleanup_integration_staging_raw();$$
);

-- LLM raw_response redaction (01:00 UTC)
select cron.schedule(
  'llm-jobs-redaction-cleanup',
  '0 1 * * *',
  $$select public.cleanup_old_llm_jobs();$$
);

commit;
