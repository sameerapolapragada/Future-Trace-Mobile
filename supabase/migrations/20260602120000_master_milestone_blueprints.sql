-- Pooled milestone blueprint cache + per-user sprint progress tracking

-- -----------------------------------------------------------------------------
-- master_milestone_blueprints — reusable milestone templates (slug-keyed cache)
-- -----------------------------------------------------------------------------
create table if not exists public.master_milestone_blueprints (
  id uuid primary key default gen_random_uuid(),
  milestone_slug text not null,
  title text not null,
  tasks_payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint master_milestone_blueprints_milestone_slug_key unique (milestone_slug),
  constraint master_milestone_blueprints_tasks_payload_object
    check (jsonb_typeof(tasks_payload) = 'object')
);

comment on table public.master_milestone_blueprints is
  'Pooled milestone templates keyed by milestone_slug for fast blueprint cache lookups.';
comment on column public.master_milestone_blueprints.milestone_slug is
  'Stable lookup key, e.g. business-analyst-senior-product-manager-phase-1';
comment on column public.master_milestone_blueprints.tasks_payload is
  'Structured micro-tasks, execution steps, curated URLs, and action items (JSON object).';

-- milestone_slug unique constraint creates a B-tree index for slug cache lookups

-- -----------------------------------------------------------------------------
-- user_sprint_progress — user ↔ blueprint engagement state
-- -----------------------------------------------------------------------------
create table if not exists public.user_sprint_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  master_blueprint_id uuid not null
    references public.master_milestone_blueprints (id) on delete cascade,
  completed_tasks jsonb not null default '[]'::jsonb,
  streak_count integer not null default 0,
  last_engaged_at timestamptz default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_sprint_progress_completed_tasks_array
    check (jsonb_typeof(completed_tasks) = 'array'),
  constraint user_sprint_progress_streak_count_non_negative
    check (streak_count >= 0),
  constraint user_sprint_progress_user_blueprint_unique
    unique (user_id, master_blueprint_id)
);

comment on table public.user_sprint_progress is
  'Tracks a user''s active relationship with a master milestone blueprint (completions, streak).';
comment on column public.user_sprint_progress.completed_tasks is
  'JSON array of completed task ids or indexes from the blueprint tasks_payload.';

create index if not exists user_sprint_progress_user_id_idx
  on public.user_sprint_progress (user_id);

create index if not exists user_sprint_progress_user_blueprint_idx
  on public.user_sprint_progress (user_id, master_blueprint_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.master_milestone_blueprints enable row level security;

alter table public.user_sprint_progress enable row level security;

-- Blueprints: read-only for authenticated users (writes via service_role / migrations)
drop policy if exists "master_milestone_blueprints_select_authenticated"
  on public.master_milestone_blueprints;
create policy "master_milestone_blueprints_select_authenticated"
  on public.master_milestone_blueprints
  for select
  to authenticated
  using (true);

-- Sprint progress: full CRUD on own rows only
drop policy if exists "user_sprint_progress_select_own" on public.user_sprint_progress;
create policy "user_sprint_progress_select_own"
  on public.user_sprint_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_sprint_progress_insert_own" on public.user_sprint_progress;
create policy "user_sprint_progress_insert_own"
  on public.user_sprint_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_sprint_progress_update_own" on public.user_sprint_progress;
create policy "user_sprint_progress_update_own"
  on public.user_sprint_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_sprint_progress_delete_own" on public.user_sprint_progress;
create policy "user_sprint_progress_delete_own"
  on public.user_sprint_progress
  for delete
  to authenticated
  using (user_id = auth.uid());
