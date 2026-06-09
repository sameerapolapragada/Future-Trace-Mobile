-- Adaptive plan updates: market signals, recommendations, milestone versions
begin;

-- Transition-specific market signals (separate from legacy market_signals table)
create table if not exists public.career_market_signals (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  industry text,
  signal_type text not null check (
    signal_type in (
      'emerging_skill',
      'declining_skill',
      'salary_shift',
      'demand_shift',
      'requirement_change'
    )
  ),
  skill_name text,
  signal_summary text not null,
  evidence_summary text,
  relevance_score smallint not null default 50 check (relevance_score >= 0 and relevance_score <= 100),
  detected_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null default 'curated_market_cache',
  created_at timestamptz not null default now()
);

create index if not exists career_market_signals_role_idx
  on public.career_market_signals (role, detected_at desc);

create index if not exists career_market_signals_expires_idx
  on public.career_market_signals (expires_at);

create table if not exists public.plan_update_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.career_goals (id) on delete cascade,
  signal_id uuid references public.career_market_signals (id) on delete set null,
  recommendation_type text not null check (
    recommendation_type in ('add_task', 'replace_task', 'add_milestone', 'adjust_priority')
  ),
  title text not null,
  summary text not null,
  why_it_matters text not null,
  expected_impact text,
  target_milestone_id uuid references public.weekly_milestones (id) on delete set null,
  proposed_changes_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'applied', 'dismissed', 'expired')
  ),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  dismissed_at timestamptz
);

create index if not exists plan_update_recommendations_user_status_idx
  on public.plan_update_recommendations (user_id, status, created_at desc);

create index if not exists plan_update_recommendations_goal_pending_idx
  on public.plan_update_recommendations (goal_id, status)
  where status = 'pending';

create unique index if not exists plan_update_recommendations_goal_signal_pending_idx
  on public.plan_update_recommendations (goal_id, signal_id)
  where status = 'pending' and signal_id is not null;

create table if not exists public.milestone_versions (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.weekly_milestones (id) on delete cascade,
  goal_id uuid not null references public.career_goals (id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  previous_content_json jsonb not null,
  new_content_json jsonb not null,
  change_reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists milestone_versions_milestone_idx
  on public.milestone_versions (milestone_id, version_number desc);

-- Notification type for plan updates
do $$ begin
  alter type public.transition_notification_type add value if not exists 'plan_update_available';
exception when duplicate_object then null;
end $$;

alter table public.transition_notifications
  add column if not exists plan_update_id uuid references public.plan_update_recommendations (id) on delete set null;

alter table public.weekly_milestones
  add column if not exists last_adaptive_update_at timestamptz,
  add column if not exists adaptive_update_note text;

-- RLS
alter table public.career_market_signals enable row level security;
alter table public.career_market_signals force row level security;

drop policy if exists "career_market_signals_select_authenticated" on public.career_market_signals;
create policy "career_market_signals_select_authenticated"
  on public.career_market_signals for select to authenticated
  using (expires_at > now());

alter table public.plan_update_recommendations enable row level security;
alter table public.plan_update_recommendations force row level security;

drop policy if exists "plan_update_recommendations_select_own" on public.plan_update_recommendations;
create policy "plan_update_recommendations_select_own"
  on public.plan_update_recommendations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "plan_update_recommendations_update_own" on public.plan_update_recommendations;
create policy "plan_update_recommendations_update_own"
  on public.plan_update_recommendations for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.milestone_versions enable row level security;
alter table public.milestone_versions force row level security;

drop policy if exists "milestone_versions_select_own" on public.milestone_versions;
create policy "milestone_versions_select_own"
  on public.milestone_versions for select to authenticated
  using (
    exists (
      select 1 from public.career_goals cg
      where cg.id = milestone_versions.goal_id and cg.user_id = auth.uid()
    )
  );

-- Seed curated signals (MVP cache)
insert into public.career_market_signals (
  role, industry, signal_type, skill_name, signal_summary, evidence_summary,
  relevance_score, detected_at, expires_at, source
)
values
  (
    'AI Product Manager',
    null,
    'emerging_skill',
    'Agentic AI',
    'Agentic AI is appearing more often in AI Product Manager requirements.',
    'Curated job posting analysis shows a 34% increase in agentic workflow mentions over 90 days.',
    87,
    now(),
    now() + interval '45 days',
    'curated_market_cache'
  ),
  (
    'AI Product Manager',
    null,
    'emerging_skill',
    'AI Evaluation',
    'AI evaluation and guardrails are increasingly listed in AI PM job descriptions.',
    'Hiring managers cite model evaluation as a top differentiator for product hires.',
    78,
    now(),
    now() + interval '45 days',
    'curated_market_cache'
  ),
  (
    'AI Governance Analyst',
    null,
    'requirement_change',
    'AI Risk Frameworks',
    'AI risk frameworks are becoming standard in governance analyst roles.',
    'Regulatory guidance is pushing companies to document AI risk controls.',
    82,
    now(),
    now() + interval '45 days',
    'curated_market_cache'
  ),
  (
    'AI Operations Analyst',
    null,
    'demand_shift',
    'Workflow Automation',
    'Demand for workflow automation skills continues to rise in AI operations roles.',
    'Operations teams are prioritizing candidates who can ship automations quickly.',
    75,
    now(),
    now() + interval '45 days',
    'curated_market_cache'
  );

-- Refresh market signals for a target role (MVP: curated cache)
create or replace function public.refresh_career_market_signals(
  p_role text,
  p_industry text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.career_market_signals
  set expires_at = now()
  where expires_at < now() - interval '1 day';

  return (select count(*)::integer from public.career_market_signals where role ilike p_role and expires_at > now());
end;
$$;

create or replace function public._goal_future_milestone_target(
  p_goal_id uuid,
  p_current_week integer
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select wm.id into target_id
  from public.weekly_milestones wm
  where wm.goal_id = p_goal_id
    and wm.status not in ('completed', 'skipped')
    and wm.week_number > p_current_week + 1
  order by wm.week_number asc
  limit 1;

  if target_id is null then
    select wm.id into target_id
    from public.weekly_milestones wm
    where wm.goal_id = p_goal_id
      and wm.status not in ('completed', 'skipped')
      and wm.week_number > p_current_week
    order by wm.week_number asc
    limit 1;
  end if;

  return target_id;
end;
$$;

create or replace function public._check_plan_updates_for_goal_impl(
  p_goal_id uuid,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  sig record;
  target_milestone uuid;
  current_week integer := 1;
  created_count integer := 0;
  task_titles text;
  proposed jsonb;
  month_label text;
  new_rec_id uuid;
begin
  select * into g
  from public.career_goals
  where id = p_goal_id and user_id = p_user_id and status = 'active';

  if g.id is null then return 0; end if;

  perform public.refresh_career_market_signals(g.target_role, null);

  select coalesce(max(week_number), 1) into current_week
  from public.weekly_milestones
  where goal_id = p_goal_id
    and status in ('in_progress', 'completed');

  for sig in
    select *
    from public.career_market_signals
    where role ilike g.target_role
      and expires_at > now()
      and relevance_score >= 70
    order by relevance_score desc
  loop
    if exists (
      select 1 from public.plan_update_recommendations
      where goal_id = p_goal_id
        and signal_id = sig.id
        and status = 'pending'
    ) then
      continue;
    end if;

    select string_agg(lower(t.title), ' ')
    into task_titles
    from public.milestone_tasks t
    join public.weekly_milestones wm on wm.id = t.milestone_id
    where wm.goal_id = p_goal_id
      and wm.status not in ('completed', 'skipped');

    if sig.skill_name is not null
      and task_titles is not null
      and position(lower(sig.skill_name) in task_titles) > 0 then
      continue;
    end if;

    target_milestone := public._goal_future_milestone_target(p_goal_id, current_week);
    if target_milestone is null then continue; end if;

    select 'Month ' || wm.unlock_month_number into month_label
    from public.weekly_milestones wm where wm.id = target_milestone;

    proposed := jsonb_build_object(
      'add_tasks', jsonb_build_array(
        jsonb_build_object(
          'title', 'Map one ' || sig.skill_name || ' use case for your target industry',
          'description', 'Research how ' || sig.skill_name || ' applies in your target role.',
          'estimated_minutes', 45,
          'task_type', 'research'
        ),
        jsonb_build_object(
          'title', 'Write a one-page product note for an ' || sig.skill_name || ' workflow',
          'description', 'Document problem, approach, and outcome for a realistic scenario.',
          'estimated_minutes', 60,
          'task_type', 'build'
        )
      )
    );

    insert into public.plan_update_recommendations (
        user_id,
        goal_id,
        signal_id,
        recommendation_type,
        title,
        summary,
        why_it_matters,
        expected_impact,
        target_milestone_id,
        proposed_changes_json,
        status
      )
      values (
        p_user_id,
        p_goal_id,
        sig.id,
        'add_task',
        'Add ' || sig.skill_name || ' basics to ' || month_label,
        sig.signal_summary,
        sig.skill_name || ' may improve your readiness for roles involving AI workflows.',
        '+6 readiness points',
        target_milestone,
        proposed,
        'pending'
      )
    returning id into new_rec_id;

    insert into public.transition_notifications (
      user_id,
      goal_id,
      plan_update_id,
      notification_type,
      title,
      message,
      scheduled_for,
      sent_at,
      status
    )
    values (
      p_user_id,
      p_goal_id,
      new_rec_id,
      'plan_update_available',
      'Plan Update Available',
      'A new skill is emerging for your target role. Review the suggested update to your transition plan.',
      now(),
      now(),
      'sent'
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

create or replace function public.check_plan_updates_for_goal(p_goal_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;

  if not exists (
    select 1 from public.career_goals
    where id = p_goal_id and user_id = uid and status = 'active'
  ) then
    raise exception 'active goal not found';
  end if;

  if not public._user_has_transition_subscription(uid) then
    raise exception 'subscription required';
  end if;

  return public._check_plan_updates_for_goal_impl(p_goal_id, uid);
end;
$$;

create or replace function public.apply_plan_update(p_recommendation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec record;
  wm record;
  prev_json jsonb;
  new_json jsonb;
  task jsonb;
  next_version integer;
  change_reason text;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  if not public._user_has_transition_subscription(uid) then
    raise exception 'subscription required';
  end if;

  select * into rec
  from public.plan_update_recommendations
  where id = p_recommendation_id and user_id = uid;

  if rec.id is null then raise exception 'recommendation not found'; end if;
  if rec.status <> 'pending' then raise exception 'recommendation not pending'; end if;

  select * into wm
  from public.weekly_milestones
  where id = rec.target_milestone_id and user_id = uid;

  if wm.id is null then raise exception 'target milestone not found'; end if;
  if wm.status = 'completed' then raise exception 'milestone already completed'; end if;

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.milestone_versions where milestone_id = wm.id;

  select jsonb_build_object(
    'milestone', jsonb_build_object(
      'title', wm.title,
      'description', wm.description,
      'expected_outcome', wm.expected_outcome
    ),
    'tasks', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'description', t.description,
        'task_type', t.task_type,
        'estimated_minutes', t.estimated_minutes,
        'status', t.status
      ) order by t.created_at
    ) filter (where t.id is not null), '[]'::jsonb)
  )
  into prev_json
  from public.weekly_milestones wm2
  left join public.milestone_tasks t on t.milestone_id = wm2.id
  where wm2.id = wm.id
  group by wm2.id, wm2.title, wm2.description, wm2.expected_outcome;

  change_reason := rec.title;

  for task in select * from jsonb_array_elements(rec.proposed_changes_json->'add_tasks')
  loop
    insert into public.milestone_tasks (
      milestone_id,
      user_id,
      title,
      description,
      task_type,
      estimated_minutes,
      status
    )
    values (
      wm.id,
      uid,
      task->>'title',
      task->>'description',
      coalesce(task->>'task_type', 'learn'),
      coalesce((task->>'estimated_minutes')::integer, 30),
      'pending'
    );
  end loop;

  update public.weekly_milestones
  set
    last_adaptive_update_at = now(),
    adaptive_update_note = 'Updated based on market signal.',
    updated_at = now()
  where id = wm.id;

  select jsonb_build_object(
    'milestone', jsonb_build_object(
      'title', wm.title,
      'description', wm.description,
      'expected_outcome', wm.expected_outcome
    ),
    'tasks', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'description', t.description,
        'task_type', t.task_type,
        'estimated_minutes', t.estimated_minutes,
        'status', t.status
      ) order by t.created_at
    ) filter (where t.id is not null), '[]'::jsonb)
  )
  into new_json
  from public.weekly_milestones wm2
  left join public.milestone_tasks t on t.milestone_id = wm2.id
  where wm2.id = wm.id
  group by wm2.id, wm2.title, wm2.description, wm2.expected_outcome;

  insert into public.milestone_versions (
    milestone_id,
    goal_id,
    version_number,
    previous_content_json,
    new_content_json,
    change_reason
  )
  values (
    wm.id,
    rec.goal_id,
    next_version,
    prev_json,
    new_json,
    change_reason
  );

  update public.plan_update_recommendations
  set status = 'applied', applied_at = now()
  where id = rec.id;
end;
$$;

create or replace function public.dismiss_plan_update(p_recommendation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;

  update public.plan_update_recommendations
  set status = 'dismissed', dismissed_at = now()
  where id = p_recommendation_id
    and user_id = uid
    and status = 'pending';

  if not found then
    raise exception 'recommendation not found or not pending';
  end if;
end;
$$;

-- Monthly batch: refresh signals + check updates for all active subscriber goals
create or replace function public.monthly_career_plan_refresh()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  total integer := 0;
  n integer;
begin
  for g in
    select cg.id, cg.target_role, cg.user_id
    from public.career_goals cg
    join public.user_entitlements ue on ue.user_id = cg.user_id
    where cg.status = 'active'
      and ue.has_radar = true
      and (ue.subscription_expires_at is null or ue.subscription_expires_at > now())
  loop
    n := public._check_plan_updates_for_goal_impl(g.id, g.user_id);
    total := total + n;
  end loop;

  return total;
end;
$$;

-- Include adaptive update metadata in milestone RPC responses
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
            'last_adaptive_update_at', wm.last_adaptive_update_at,
            'adaptive_update_note', wm.adaptive_update_note,
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
            'last_adaptive_update_at', wm.last_adaptive_update_at,
            'adaptive_update_note', wm.adaptive_update_note,
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
    'last_adaptive_update_at', wm.last_adaptive_update_at,
    'adaptive_update_note', wm.adaptive_update_note,
    'created_at', wm.created_at,
    'updated_at', wm.updated_at,
    'tasks', tasks
  );
end;
$$;

comment on function public.monthly_career_plan_refresh() is
  'Scheduled monthly job: refresh market signals and create plan update recommendations for active subscribers. Call via service_role cron.';

revoke all on function public.refresh_career_market_signals(text, text) from public;
revoke all on function public.check_plan_updates_for_goal(uuid) from public;
revoke all on function public.apply_plan_update(uuid) from public;
revoke all on function public.dismiss_plan_update(uuid) from public;
revoke all on function public.monthly_career_plan_refresh() from public;

grant execute on function public.refresh_career_market_signals(text, text) to authenticated;
grant execute on function public.check_plan_updates_for_goal(uuid) to authenticated;
grant execute on function public.apply_plan_update(uuid) to authenticated;
grant execute on function public.dismiss_plan_update(uuid) to authenticated;
grant execute on function public.monthly_career_plan_refresh() to service_role;

commit;
