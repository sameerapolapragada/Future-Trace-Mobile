-- Goal comparison, switching history, and denormalized X-Ray / goal metrics
begin;

alter table public.career_goals
  add column if not exists source_xray_id uuid references public.career_xrays (id) on delete set null,
  add column if not exists transition_difficulty text,
  add column if not exists estimated_transition_time text,
  add column if not exists salary_upside text,
  add column if not exists market_demand text,
  add column if not exists top_strengths jsonb not null default '[]'::jsonb,
  add column if not exists biggest_skill_gaps jsonb not null default '[]'::jsonb,
  add column if not exists recommended_next_action text,
  add column if not exists paused_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.career_xrays
  add column if not exists readiness_score smallint check (readiness_score is null or (readiness_score >= 0 and readiness_score <= 100)),
  add column if not exists transition_difficulty text,
  add column if not exists estimated_transition_time text,
  add column if not exists salary_upside text,
  add column if not exists market_demand text;

create table if not exists public.goal_switch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_goal_id uuid references public.career_goals (id) on delete set null,
  to_goal_id uuid references public.career_goals (id) on delete set null,
  from_xray_id uuid references public.career_xrays (id) on delete set null,
  to_xray_id uuid references public.career_xrays (id) on delete set null,
  reason text,
  switched_at timestamptz not null default now()
);

create index if not exists goal_switch_history_user_idx
  on public.goal_switch_history (user_id, switched_at desc);

alter table public.goal_switch_history enable row level security;
alter table public.goal_switch_history force row level security;

drop policy if exists "goal_switch_history_select_own" on public.goal_switch_history;
create policy "goal_switch_history_select_own"
  on public.goal_switch_history for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "goal_switch_history_insert_own" on public.goal_switch_history;
create policy "goal_switch_history_insert_own"
  on public.goal_switch_history for insert to authenticated
  with check (user_id = auth.uid());

commit;
