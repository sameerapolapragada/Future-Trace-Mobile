-- Harden internal SECURITY DEFINER helpers: not callable via PostgREST by anon/authenticated.
-- Supabase linter: anon_security_definer_function_executable

begin;

do $revoke$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as regproc
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like '\_%'
  loop
    execute format('revoke all on function %s from public', fn.regproc);
    execute format('revoke all on function %s from anon', fn.regproc);
    execute format('revoke all on function %s from authenticated', fn.regproc);
    execute format('grant execute on function %s to service_role', fn.regproc);
  end loop;
end;
$revoke$;

commit;
