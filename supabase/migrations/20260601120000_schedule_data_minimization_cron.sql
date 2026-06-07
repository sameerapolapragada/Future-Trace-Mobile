-- =============================================================================
-- Schedule nightly data minimization (free-tier scan purge) via pg_cron
-- Requires: cleanup_old_free_scans() from 20260530120000_gdpr_ccpa_compliance_data_layer.sql
--
-- pg_cron is pre-installed on Supabase hosted projects (cron schema).
-- Do NOT run CREATE EXTENSION here — it causes SQLSTATE 2BP01 (dependent privileges).
-- Enable via Dashboard → Database → Extensions → pg_cron if missing on local CLI.
-- =============================================================================

begin;

do $cron$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed — enable in Supabase Dashboard; skipping cron setup';
    return;
  end if;

  if exists (
    select 1 from cron.job where jobname = 'data-minimization-cleanup'
  ) then
    perform cron.unschedule('data-minimization-cleanup');
  end if;

  perform cron.schedule(
    'data-minimization-cleanup',
    '0 0 * * *',
    $$select public.cleanup_old_free_scans();$$
  );
exception
  when undefined_table then
    raise notice 'pg_cron cron.job not available — enable pg_cron extension, then re-apply';
  when undefined_function then
    raise notice 'cron.schedule not available — enable pg_cron extension, then re-apply';
end;
$cron$;

commit;
