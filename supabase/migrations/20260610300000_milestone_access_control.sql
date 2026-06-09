-- Monthly milestone access control: reveal 4 weeks at a time
begin;

alter table public.weekly_milestones
  add column if not exists unlock_month_number smallint not null default 1 check (unlock_month_number >= 1 and unlock_month_number <= 3),
  add column if not exists unlock_date timestamptz,
  add column if not exists is_unlocked boolean not null default false,
  add column if not exists locked_preview_title text,
  add column if not exists locked_preview_description text,
  add column if not exists full_content_revealed_at timestamptz;

-- Backfill existing milestones
update public.weekly_milestones wm
set
  unlock_month_number = ((wm.week_number - 1) / 4) + 1,
  unlock_date = cg.started_at + (((wm.week_number - 1) / 4) * interval '30 days'),
  locked_preview_title = coalesce(wm.locked_preview_title, split_part(wm.title, ' ', 1) || ' ' || coalesce(nullif(split_part(wm.title, ' ', 2), ''), 'Milestone')),
  locked_preview_description = coalesce(wm.locked_preview_description, 'Unlocks next month'),
  is_unlocked = ((wm.week_number - 1) / 4) + 1 = 1
from public.career_goals cg
where cg.id = wm.goal_id
  and wm.unlock_date is null;

-- Internal: compute unlocked month without auth (for RLS / triggers)
create or replace function public._compute_unlocked_month(p_goal_id uuid)
returns smallint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g record;
  month1_avg numeric;
  month2_avg numeric;
  goal_age_days integer;
  unlocked smallint := 1;
begin
  select started_at, user_id into g
  from public.career_goals
  where id = p_goal_id;

  if g.started_at is null then
    return 1;
  end if;

  goal_age_days := greatest(0, extract(day from (now() - g.started_at))::integer);

  select coalesce(avg(completion_percentage), 0) into month1_avg
  from public.weekly_milestones
  where goal_id = p_goal_id and unlock_month_number = 1;

  if goal_age_days >= 30 or month1_avg >= 75 then
    unlocked := 2;
  end if;

  select coalesce(avg(completion_percentage), 0) into month2_avg
  from public.weekly_milestones
  where goal_id = p_goal_id and unlock_month_number = 2;

  if unlocked >= 2 and (goal_age_days >= 60 or month2_avg >= 75) then
    unlocked := 3;
  end if;

  return unlocked;
end;
$$;

create or replace function public.get_unlocked_month_for_goal(p_goal_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select user_id into owner from public.career_goals where id = p_goal_id;
  if owner is null or owner <> uid then
    raise exception 'goal not found';
  end if;

  return public._compute_unlocked_month(p_goal_id);
end;
$$;

create or replace function public._user_has_transition_subscription(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ent record;
begin
  select has_radar, subscription_expires_at into ent
  from public.user_entitlements
  where user_id = p_user_id;

  if ent is null or not ent.has_radar then
    return false;
  end if;

  if ent.subscription_expires_at is not null then
    return ent.subscription_expires_at > now();
  end if;

  return true;
end;
$$;

create or replace function public.sync_milestone_unlocks(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner uuid;
  unlocked smallint;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select user_id into owner from public.career_goals where id = p_goal_id;
  if owner is null or owner <> uid then raise exception 'goal not found'; end if;

  unlocked := public._compute_unlocked_month(p_goal_id);

  update public.weekly_milestones wm
  set
    is_unlocked = wm.unlock_month_number <= unlocked,
    full_content_revealed_at = case
      when wm.unlock_month_number <= unlocked and wm.full_content_revealed_at is null then now()
      else wm.full_content_revealed_at
    end,
    updated_at = now()
  where wm.goal_id = p_goal_id;
end;
$$;

create or replace function public.get_visible_milestones(p_goal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner uuid;
  unlocked smallint;
  result jsonb := '[]'::jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select user_id into owner from public.career_goals where id = p_goal_id;
  if owner is null or owner <> uid then raise exception 'goal not found'; end if;

  if not public._user_has_transition_subscription(uid) then
    raise exception 'subscription required';
  end if;

  perform public.sync_milestone_unlocks(p_goal_id);
  unlocked := public._compute_unlocked_month(p_goal_id);

  select coalesce(jsonb_agg(row order by week_number), '[]'::jsonb)
  into result
  from (
    select
      wm.week_number,
      case
        when wm.unlock_month_number <= unlocked then
          jsonb_build_object(
            'id', wm.id,
            'goal_id', wm.goal_id,
            'user_id', wm.user_id,
            'week_number', wm.week_number,
            'title', wm.title,
            'description', wm.description,
            'expected_outcome', wm.expected_outcome,
            'estimated_hours', wm.estimated_hours,
            'start_date', wm.start_date,
            'due_date', wm.due_date,
            'status', wm.status,
            'completion_percentage', wm.completion_percentage,
            'unlock_month_number', wm.unlock_month_number,
            'unlock_date', wm.unlock_date,
            'is_unlocked', true,
            'locked_preview_title', wm.locked_preview_title,
            'locked_preview_description', wm.locked_preview_description,
            'full_content_revealed_at', wm.full_content_revealed_at,
            'created_at', wm.created_at,
            'updated_at', wm.updated_at,
            'tasks', '[]'::jsonb
          )
        else
          jsonb_build_object(
            'id', wm.id,
            'goal_id', wm.goal_id,
            'user_id', wm.user_id,
            'week_number', wm.week_number,
            'title', wm.locked_preview_title,
            'description', wm.locked_preview_description,
            'expected_outcome', null,
            'estimated_hours', null,
            'start_date', wm.start_date,
            'due_date', wm.due_date,
            'status', 'locked',
            'completion_percentage', 0,
            'unlock_month_number', wm.unlock_month_number,
            'unlock_date', wm.unlock_date,
            'is_unlocked', false,
            'locked_preview_title', wm.locked_preview_title,
            'locked_preview_description', wm.locked_preview_description,
            'full_content_revealed_at', null,
            'created_at', wm.created_at,
            'updated_at', wm.updated_at,
            'tasks', '[]'::jsonb
          )
      end as row,
      wm.week_number
    from public.weekly_milestones wm
    where wm.goal_id = p_goal_id and wm.user_id = uid
  ) sub;

  return result;
end;
$$;

create or replace function public.get_visible_milestone_with_tasks(p_milestone_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wm record;
  unlocked smallint;
  tasks jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select * into wm
  from public.weekly_milestones
  where id = p_milestone_id and user_id = uid;

  if wm.id is null then
    raise exception 'milestone not found';
  end if;

  if not public._user_has_transition_subscription(uid) then
    raise exception 'subscription required';
  end if;

  perform public.sync_milestone_unlocks(wm.goal_id);
  unlocked := public._compute_unlocked_month(wm.goal_id);

  if wm.unlock_month_number > unlocked then
    raise exception 'milestone_locked';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'milestone_id', t.milestone_id,
      'user_id', t.user_id,
      'title', t.title,
      'description', t.description,
      'task_type', t.task_type,
      'estimated_minutes', t.estimated_minutes,
      'status', t.status,
      'completed_at', t.completed_at,
      'created_at', t.created_at,
      'updated_at', t.updated_at
    ) order by t.created_at
  ), '[]'::jsonb)
  into tasks
  from public.milestone_tasks t
  where t.milestone_id = p_milestone_id and t.user_id = uid;

  return jsonb_build_object(
    'id', wm.id,
    'goal_id', wm.goal_id,
    'user_id', wm.user_id,
    'week_number', wm.week_number,
    'title', wm.title,
    'description', wm.description,
    'expected_outcome', wm.expected_outcome,
    'estimated_hours', wm.estimated_hours,
    'start_date', wm.start_date,
    'due_date', wm.due_date,
    'status', wm.status,
    'completion_percentage', wm.completion_percentage,
    'unlock_month_number', wm.unlock_month_number,
    'unlock_date', wm.unlock_date,
    'is_unlocked', true,
    'locked_preview_title', wm.locked_preview_title,
    'locked_preview_description', wm.locked_preview_description,
    'full_content_revealed_at', wm.full_content_revealed_at,
    'created_at', wm.created_at,
    'updated_at', wm.updated_at,
    'tasks', tasks
  );
end;
$$;

-- Block direct task access for locked milestones
drop policy if exists "milestone_tasks_select_own" on public.milestone_tasks;
create policy "milestone_tasks_select_unlocked"
  on public.milestone_tasks for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.weekly_milestones wm
      where wm.id = milestone_tasks.milestone_id
        and wm.user_id = auth.uid()
        and wm.unlock_month_number <= public._compute_unlocked_month(wm.goal_id)
    )
  );

drop policy if exists "milestone_tasks_update_own" on public.milestone_tasks;
create policy "milestone_tasks_update_unlocked"
  on public.milestone_tasks for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.weekly_milestones wm
      where wm.id = milestone_tasks.milestone_id
        and wm.user_id = auth.uid()
        and wm.unlock_month_number <= public._compute_unlocked_month(wm.goal_id)
    )
  )
  with check (user_id = auth.uid());

revoke all on function public._compute_unlocked_month(uuid) from public;
revoke all on function public._user_has_transition_subscription(uuid) from public;
revoke all on function public.get_unlocked_month_for_goal(uuid) from public;
revoke all on function public.sync_milestone_unlocks(uuid) from public;
revoke all on function public.get_visible_milestones(uuid) from public;
revoke all on function public.get_visible_milestone_with_tasks(uuid) from public;

grant execute on function public.get_unlocked_month_for_goal(uuid) to authenticated;
grant execute on function public.sync_milestone_unlocks(uuid) to authenticated;
grant execute on function public.get_visible_milestones(uuid) to authenticated;
grant execute on function public.get_visible_milestone_with_tasks(uuid) to authenticated;

commit;
