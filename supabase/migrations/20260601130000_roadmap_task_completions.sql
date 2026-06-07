-- Premium roadmap task completion tracking (per profile, per milestone micro-task)

create table if not exists public.roadmap_task_completions (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  milestone_key text not null,
  task_id text not null,
  completed_at timestamptz not null default now(),
  primary key (profile_id, milestone_key, task_id)
);

create index if not exists roadmap_task_completions_profile_idx
  on public.roadmap_task_completions (profile_id);

alter table public.roadmap_task_completions enable row level security;

drop policy if exists "roadmap_task_completions_select_own" on public.roadmap_task_completions;
create policy "roadmap_task_completions_select_own"
  on public.roadmap_task_completions
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "roadmap_task_completions_insert_own" on public.roadmap_task_completions;
create policy "roadmap_task_completions_insert_own"
  on public.roadmap_task_completions
  for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "roadmap_task_completions_delete_own" on public.roadmap_task_completions;
create policy "roadmap_task_completions_delete_own"
  on public.roadmap_task_completions
  for delete
  to authenticated
  using (profile_id = auth.uid());
