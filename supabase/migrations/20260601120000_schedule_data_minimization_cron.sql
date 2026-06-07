-- =============================================================================
-- Schedule nightly data minimization (free-tier scan purge) via pg_cron
-- Requires: cleanup_old_free_scans() from 20260530120000_gdpr_ccpa_compliance_data_layer.sql
--
-- If CREATE EXTENSION fails, enable pg_cron first:
--   Dashboard → Database → Extensions → pg_cron → Enable
-- Then re-run this migration or supabase/scripts/schedule_data_minimization_cron.sql
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Enable pg_cron (Supabase: typically installed into schema "extensions")
-- -----------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;

-- Ensure cron metadata schema is usable (Supabase exposes cron.job / cron.job_run_details)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- -----------------------------------------------------------------------------
-- 2. Idempotently replace existing job named data-minimization-cleanup
-- -----------------------------------------------------------------------------
do $cron$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'data-minimization-cleanup'
  ) then
    perform cron.unschedule('data-minimization-cleanup');
  end if;
exception
  when undefined_table then
    raise exception
      'pg_cron is not available (cron.job missing). Enable the pg_cron extension in the Supabase Dashboard, then re-apply this migration.';
  when undefined_function then
    raise exception
      'cron.unschedule is not available. Enable pg_cron and ensure the cron schema is installed.';
end;
$cron$;

-- -----------------------------------------------------------------------------
-- 3. Schedule cleanup_old_free_scans() — every night at 00:00 UTC
-- -----------------------------------------------------------------------------
select cron.schedule(
  'data-minimization-cleanup',
  '0 0 * * *',
  $$select public.cleanup_old_free_scans();$$
);

commit;

-- =============================================================================
-- Verification (run manually in SQL Editor after apply)
-- =============================================================================
--
-- Registered job:
--   select jobid, jobname, schedule, command, active, database, username
--   from cron.job
--   where jobname = 'data-minimization-cleanup';
--
-- Recent runs (newest first):
--   select
--     d.jobid,
--     j.jobname,
--     d.runid,
--     d.status,
--     d.start_time,
--     d.end_time,
--     d.return_message
--   from cron.job_run_details d
--   join cron.job j on j.jobid = d.jobid
--   where j.jobname = 'data-minimization-cleanup'
--   order by d.start_time desc
--   limit 20;
--
-- One-off test run (optional):
--   select public.cleanup_old_free_scans();
