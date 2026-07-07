-- MVP ship: tighten career_xray_waitlist RLS (strict insert, remove open delete)
begin;

-- Normalize existing rows before adding constraints
update public.career_xray_waitlist
set email = lower(trim(email))
where email is not null and email <> lower(trim(email));

alter table public.career_xray_waitlist
  drop constraint if exists career_xray_waitlist_email_format_chk,
  add constraint career_xray_waitlist_email_format_chk
    check (
      email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
      and email = lower(trim(email))
      and length(email) <= 320
    ),
  drop constraint if exists career_xray_waitlist_source_chk,
  add constraint career_xray_waitlist_source_chk
    check (source in ('ios_app', 'web_app')),
  drop constraint if exists career_xray_waitlist_roles_chk,
  add constraint career_xray_waitlist_roles_chk
    check (
      length(trim(coalesce("current_role", ''))) between 1 and 200
      and length(trim(coalesce("target_role", ''))) between 1 and 200
    );

drop policy if exists "career_xray_waitlist_insert_anon" on public.career_xray_waitlist;
drop policy if exists "career_xray_waitlist_delete_anon" on public.career_xray_waitlist;

-- Inserts only with validated shape; no client reads or deletes (service role / support for removal)
create policy "career_xray_waitlist_insert_strict"
  on public.career_xray_waitlist
  for insert
  to anon, authenticated
  with check (
    email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and email = lower(trim(email))
    and length(email) <= 320
    and source in ('ios_app', 'web_app')
    and length(trim("current_role")) between 1 and 200
    and length(trim("target_role")) between 1 and 200
  );

-- Explicit deny for client updates
create policy "career_xray_waitlist_update_none"
  on public.career_xray_waitlist
  for update
  to anon, authenticated
  using (false);

comment on table public.career_xray_waitlist is
  'Career X-Ray launch waitlist. Clients may insert only; no select/update/delete from anon/authenticated.';

commit;
