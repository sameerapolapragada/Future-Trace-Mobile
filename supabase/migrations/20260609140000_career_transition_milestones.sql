-- AI Career Transition: career goals, weekly milestones, tasks, in-app notifications
begin;

do $$ begin
  create type public.career_goal_status as enum ('active', 'paused', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.weekly_milestone_status as enum (
    'not_started', 'in_progress', 'completed', 'missed', 'skipped'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.milestone_task_type as enum (
    'learn', 'build', 'reflect', 'research', 'update_profile', 'apply'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.milestone_task_status as enum ('pending', 'completed', 'skipped');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transition_notification_type as enum (
    'weekly_start',
    'midweek_reminder',
    'deadline_reminder',
    'completion_celebration',
    'missed_milestone'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transition_notification_status as enum (
    'scheduled', 'sent', 'failed', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.career_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  "current_role" text not null,
  target_role text not null,
  source_scan_id uuid references public.career_scans (id) on delete set null,
  status public.career_goal_status not null default 'active',
  readiness_score smallint not null default 0 check (readiness_score >= 0 and readiness_score <= 100),
  plan_length_weeks smallint not null default 8 check (plan_length_weeks in (8, 12)),
  started_at timestamptz not null default now(),
  target_completion_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_goals_user_status_idx
  on public.career_goals (user_id, status);

create unique index if not exists career_goals_one_active_per_user_idx
  on public.career_goals (user_id)
  where status = 'active';

drop trigger if exists career_goals_updated_at on public.career_goals;
create trigger career_goals_updated_at
  before update on public.career_goals
  for each row execute function public.set_updated_at();

create table if not exists public.weekly_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.career_goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_number smallint not null check (week_number >= 1 and week_number <= 12),
  title text not null,
  description text not null,
  expected_outcome text not null,
  estimated_hours numeric(4, 1) not null default 3.0 check (estimated_hours > 0),
  start_date date not null,
  due_date date not null,
  status public.weekly_milestone_status not null default 'not_started',
  completion_percentage smallint not null default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, week_number)
);

create index if not exists weekly_milestones_goal_week_idx
  on public.weekly_milestones (goal_id, week_number);

create index if not exists weekly_milestones_user_due_idx
  on public.weekly_milestones (user_id, due_date);

drop trigger if exists weekly_milestones_updated_at on public.weekly_milestones;
create trigger weekly_milestones_updated_at
  before update on public.weekly_milestones
  for each row execute function public.set_updated_at();

create table if not exists public.milestone_tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.weekly_milestones (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  task_type public.milestone_task_type not null default 'learn',
  estimated_minutes smallint not null default 30 check (estimated_minutes > 0),
  status public.milestone_task_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists milestone_tasks_milestone_idx
  on public.milestone_tasks (milestone_id);

drop trigger if exists milestone_tasks_updated_at on public.milestone_tasks;
create trigger milestone_tasks_updated_at
  before update on public.milestone_tasks
  for each row execute function public.set_updated_at();

-- In-app notifications for career transition (MVP; push later)
create table if not exists public.transition_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.career_goals (id) on delete cascade,
  milestone_id uuid references public.weekly_milestones (id) on delete cascade,
  notification_type public.transition_notification_type not null,
  title text not null,
  message text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  read_at timestamptz,
  status public.transition_notification_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index if not exists transition_notifications_user_scheduled_idx
  on public.transition_notifications (user_id, scheduled_for desc);

create index if not exists transition_notifications_user_unread_idx
  on public.transition_notifications (user_id, read_at)
  where read_at is null and status = 'sent';

-- RLS
alter table public.career_goals enable row level security;
alter table public.career_goals force row level security;

drop policy if exists "career_goals_select_own" on public.career_goals;
create policy "career_goals_select_own"
  on public.career_goals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "career_goals_insert_own" on public.career_goals;
create policy "career_goals_insert_own"
  on public.career_goals for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "career_goals_update_own" on public.career_goals;
create policy "career_goals_update_own"
  on public.career_goals for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.weekly_milestones enable row level security;
alter table public.weekly_milestones force row level security;

drop policy if exists "weekly_milestones_select_own" on public.weekly_milestones;
create policy "weekly_milestones_select_own"
  on public.weekly_milestones for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "weekly_milestones_insert_own" on public.weekly_milestones;
create policy "weekly_milestones_insert_own"
  on public.weekly_milestones for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "weekly_milestones_update_own" on public.weekly_milestones;
create policy "weekly_milestones_update_own"
  on public.weekly_milestones for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.milestone_tasks enable row level security;
alter table public.milestone_tasks force row level security;

drop policy if exists "milestone_tasks_select_own" on public.milestone_tasks;
create policy "milestone_tasks_select_own"
  on public.milestone_tasks for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "milestone_tasks_insert_own" on public.milestone_tasks;
create policy "milestone_tasks_insert_own"
  on public.milestone_tasks for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "milestone_tasks_update_own" on public.milestone_tasks;
create policy "milestone_tasks_update_own"
  on public.milestone_tasks for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.transition_notifications enable row level security;
alter table public.transition_notifications force row level security;

drop policy if exists "transition_notifications_select_own" on public.transition_notifications;
create policy "transition_notifications_select_own"
  on public.transition_notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "transition_notifications_insert_own" on public.transition_notifications;
create policy "transition_notifications_insert_own"
  on public.transition_notifications for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "transition_notifications_update_own" on public.transition_notifications;
create policy "transition_notifications_update_own"
  on public.transition_notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Product alias for AI Career Transition ($9.99/mo — same subscription tier as Radar)
insert into public.products (id, name, description, price_cents, price_interval, stripe_price_id, sort_order)
values (
  'ai_career_transition_monthly',
  'AI Career Transition',
  'Weekly milestones, unlimited scans & Career X-Rays, progress tracking and reminders',
  999,
  'month',
  null,
  2
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

commit;
