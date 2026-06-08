-- Atomic free-scan quota decrement for authenticated clients (Week 1 bridge until POST /api/v1/scans)

begin;

create or replace function public.consume_free_scan()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  remaining integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.user_entitlements
  set
    free_scans_remaining = free_scans_remaining - 1,
    updated_at = now()
  where user_id = uid
    and free_scans_remaining > 0
  returning free_scans_remaining into remaining;

  if not found then
    raise exception 'No free scans remaining';
  end if;

  return remaining;
end;
$$;

revoke all on function public.consume_free_scan() from public;
grant execute on function public.consume_free_scan() to authenticated;

commit;
