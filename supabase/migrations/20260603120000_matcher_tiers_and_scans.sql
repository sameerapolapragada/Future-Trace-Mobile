-- Matcher tier columns + unified resume scan history

begin;

alter table public.profiles
  add column if not exists web_tier text not null default 'free',
  add column if not exists mobile_tier text not null default 'free',
  add column if not exists token_balance integer not null default 0;

create table if not exists public.user_resume_scans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  "current_role" text not null,
  "target_role" text not null,
  resume_text text,
  market_risk_score integer not null check (market_risk_score >= 0 and market_risk_score <= 100),
  risk_rationale text not null,
  matched_roles jsonb not null default '[]'::jsonb,
  is_paid_scan boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_resume_scans_profile_created_idx
  on public.user_resume_scans (profile_id, created_at desc);

alter table public.user_resume_scans enable row level security;

drop policy if exists "user_resume_scans_select_own" on public.user_resume_scans;
create policy "user_resume_scans_select_own"
  on public.user_resume_scans for select
  using (
    profile_id in (select id from public.profiles where id = auth.uid())
  );

drop policy if exists "user_resume_scans_insert_own" on public.user_resume_scans;
create policy "user_resume_scans_insert_own"
  on public.user_resume_scans for insert
  with check (
    profile_id in (select id from public.profiles where id = auth.uid())
  );

commit;
