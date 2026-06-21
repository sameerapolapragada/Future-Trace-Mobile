-- AI orchestration: premium refresh tracking + access context RPC for BFF routing.
begin;

alter table public.career_goals
  add column if not exists last_refresh_at timestamptz,
  add column if not exists last_premium_refresh_at timestamptz,
  add column if not exists roadmap_json jsonb;

comment on column public.career_goals.last_refresh_at is
  'Last Gemini Flash roadmap/signal refresh for this goal.';
comment on column public.career_goals.last_premium_refresh_at is
  'Last Gemini Pro premium roadmap refresh (max once per 30 days).';
comment on column public.career_goals.roadmap_json is
  'Persisted roadmap output — reuse instead of regenerating.';

create index if not exists career_goals_premium_refresh_idx
  on public.career_goals (user_id, last_premium_refresh_at desc)
  where status = 'active';

-- Returns tier context for BFF model routing (service_role only).
create or replace function public.get_ai_access_context(
  p_user_id uuid,
  p_scan_id uuid default null,
  p_goal_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_radar boolean := false;
  v_sub_expires timestamptz;
  v_has_transition boolean := false;
  v_has_xray_purchase boolean := false;
  v_has_xray_result boolean := false;
  v_has_scan_result boolean := false;
  v_last_premium_refresh timestamptz;
  v_plan text := 'free';
begin
  select ue.has_radar, ue.subscription_expires_at
  into v_has_radar, v_sub_expires
  from public.user_entitlements ue
  where ue.user_id = p_user_id;

  v_has_transition := coalesce(v_has_radar, false)
    and (v_sub_expires is null or v_sub_expires > now());

  if v_has_transition then
    v_plan := 'career_transition';
  end if;

  if p_scan_id is not null then
    select exists (
      select 1 from public.career_xrays cx
      where cx.user_id = p_user_id
        and cx.scan_id = p_scan_id
        and cx.status in ('paid', 'generated')
    )
    into v_has_xray_purchase;

    select exists (
      select 1 from public.career_xrays cx
      where cx.user_id = p_user_id
        and cx.scan_id = p_scan_id
        and cx.status = 'generated'
        and cx.xray_result_json is not null
    )
    into v_has_xray_result;

    select exists (
      select 1 from public.career_scans cs
      where cs.user_id = p_user_id
        and cs.id = p_scan_id
        and cs.status = 'complete'
        and (cs.free_result_json is not null or cs.result is not null)
    )
    into v_has_scan_result;
  end if;

  if p_goal_id is not null then
    select cg.last_premium_refresh_at
    into v_last_premium_refresh
    from public.career_goals cg
    where cg.id = p_goal_id
      and cg.user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'plan', v_plan,
    'has_transition_subscription', v_has_transition,
    'has_career_xray_purchase', v_has_xray_purchase,
    'has_existing_xray_result', v_has_xray_result,
    'has_existing_scan_result', v_has_scan_result,
    'last_premium_refresh_at', v_last_premium_refresh,
    'scan_id', p_scan_id,
    'goal_id', p_goal_id
  );
end;
$$;

revoke all on function public.get_ai_access_context(uuid, uuid, uuid) from public;
grant execute on function public.get_ai_access_context(uuid, uuid, uuid) to service_role;

commit;
