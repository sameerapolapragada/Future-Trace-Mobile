-- Fix: jsonb_agg(row order by week_number) failed because week_number appeared twice in subquery
begin;

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

  select coalesce(jsonb_agg(sub.row order by sub.week_number), '[]'::jsonb)
  into result
  from (
    select
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

commit;
