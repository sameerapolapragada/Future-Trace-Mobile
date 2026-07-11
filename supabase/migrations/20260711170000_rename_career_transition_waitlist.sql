-- Rename Career X-Ray waitlist → AI Career Transition Early Access waitlist
begin;

-- Already renamed? no-op path for re-runs
do $$
begin
  if to_regclass('public.career_xray_waitlist') is not null
     and to_regclass('public.career_transition_waitlist') is null then

    drop policy if exists "career_xray_waitlist_insert_strict" on public.career_xray_waitlist;
    drop policy if exists "career_xray_waitlist_update_none" on public.career_xray_waitlist;
    drop policy if exists "career_xray_waitlist_select_none" on public.career_xray_waitlist;
    drop policy if exists "career_xray_waitlist_insert_anon" on public.career_xray_waitlist;
    drop policy if exists "career_xray_waitlist_delete_anon" on public.career_xray_waitlist;

    alter table public.career_xray_waitlist rename to career_transition_waitlist;
  end if;
end $$;

-- Rename constraints when old names still exist
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'career_xray_waitlist_pkey'
      and conrelid = 'public.career_transition_waitlist'::regclass
  ) then
    alter table public.career_transition_waitlist
      rename constraint career_xray_waitlist_pkey to career_transition_waitlist_pkey;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'career_xray_waitlist_email_unique'
      and conrelid = 'public.career_transition_waitlist'::regclass
  ) then
    alter table public.career_transition_waitlist
      rename constraint career_xray_waitlist_email_unique to career_transition_waitlist_email_unique;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'career_xray_waitlist_email_format_chk'
      and conrelid = 'public.career_transition_waitlist'::regclass
  ) then
    alter table public.career_transition_waitlist
      rename constraint career_xray_waitlist_email_format_chk to career_transition_waitlist_email_format_chk;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'career_xray_waitlist_source_chk'
      and conrelid = 'public.career_transition_waitlist'::regclass
  ) then
    alter table public.career_transition_waitlist
      rename constraint career_xray_waitlist_source_chk to career_transition_waitlist_source_chk;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'career_xray_waitlist_roles_chk'
      and conrelid = 'public.career_transition_waitlist'::regclass
  ) then
    alter table public.career_transition_waitlist
      rename constraint career_xray_waitlist_roles_chk to career_transition_waitlist_roles_chk;
  end if;
end $$;

alter index if exists public.career_xray_waitlist_created_at_idx
  rename to career_transition_waitlist_created_at_idx;

-- Ensure RLS policies use the new names
drop policy if exists "career_transition_waitlist_select_none" on public.career_transition_waitlist;
drop policy if exists "career_transition_waitlist_insert_strict" on public.career_transition_waitlist;
drop policy if exists "career_transition_waitlist_update_none" on public.career_transition_waitlist;

create policy "career_transition_waitlist_select_none"
  on public.career_transition_waitlist
  for select
  to anon, authenticated
  using (false);

create policy "career_transition_waitlist_insert_strict"
  on public.career_transition_waitlist
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

create policy "career_transition_waitlist_update_none"
  on public.career_transition_waitlist
  for update
  to anon, authenticated
  using (false);

comment on table public.career_transition_waitlist is
  'AI Career Transition Early Access waitlist. Clients may insert only; no select/update/delete from anon/authenticated.';

commit;
