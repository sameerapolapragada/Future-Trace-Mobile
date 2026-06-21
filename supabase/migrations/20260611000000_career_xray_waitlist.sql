-- Career X-Ray launch waitlist (Phase 1 mobile MVP)
create table if not exists public.career_xray_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  current_role text,
  target_role text,
  source text not null default 'ios_app',
  created_at timestamptz not null default now(),
  constraint career_xray_waitlist_email_unique unique (email)
);

create index if not exists career_xray_waitlist_created_at_idx
  on public.career_xray_waitlist (created_at desc);

alter table public.career_xray_waitlist enable row level security;

-- Allow anonymous inserts from the mobile app (Phase 1)
create policy "career_xray_waitlist_insert_anon"
  on public.career_xray_waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Users cannot read the full waitlist from the client
create policy "career_xray_waitlist_select_none"
  on public.career_xray_waitlist
  for select
  to anon, authenticated
  using (false);

comment on table public.career_xray_waitlist is
  'Phase 1 Career X-Ray launch waitlist signups from native iOS app.';
