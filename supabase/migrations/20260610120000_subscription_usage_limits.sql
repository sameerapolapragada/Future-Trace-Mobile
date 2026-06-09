-- AI Career Transition monthly usage limits (10 scans, 10 X-Rays, 3 goal switches per billing cycle)
begin;

-- career_goals: track source X-Ray
alter table public.career_goals
  add column if not exists source_xray_id uuid references public.career_xrays (id) on delete set null;

-- Monthly usage per subscriber billing cycle
create table if not exists public.subscription_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  month_start timestamptz not null,
  month_end timestamptz not null,
  career_scans_used integer not null default 0 check (career_scans_used >= 0),
  career_xrays_used integer not null default 0 check (career_xrays_used >= 0),
  goal_switches_used integer not null default 0 check (goal_switches_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_start)
);

create index if not exists subscription_usage_user_period_idx
  on public.subscription_usage (user_id, month_end desc);

drop trigger if exists subscription_usage_updated_at on public.subscription_usage;
create trigger subscription_usage_updated_at
  before update on public.subscription_usage
  for each row execute function public.set_updated_at();

alter table public.subscription_usage enable row level security;
alter table public.subscription_usage force row level security;

drop policy if exists "subscription_usage_select_own" on public.subscription_usage;
create policy "subscription_usage_select_own"
  on public.subscription_usage for select to authenticated
  using (user_id = auth.uid());

-- Products: transition subscription + extra X-Ray
update public.products
set
  description = '10 career scans/month, 10 Career X-Rays/month, weekly milestones, progress tracking and reminders',
  name = 'AI Career Transition'
where id = 'ai_career_transition_monthly';

insert into public.products (id, name, description, price_cents, price_interval, stripe_price_id, sort_order)
values (
  'career_xray_extra',
  'Extra Career X-Ray',
  'One additional Career X-Ray for a specific scan',
  199,
  'one_time',
  null,
  3
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents;

-- Resolve active AI Career Transition subscription (has_radar flag + valid period)
create or replace function public.get_active_transition_subscription(p_user_id uuid)
returns table (
  subscription_id uuid,
  product_key text,
  period_start timestamptz,
  period_end timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  ent record;
  sub record;
begin
  select has_radar, subscription_expires_at
  into ent
  from public.user_entitlements
  where user_id = p_user_id;

  if ent is null or not ent.has_radar then
    return;
  end if;

  select s.id, s.product_key, s.current_period_end
  into sub
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.status = 'active'
    and s.product_key in ('ai_career_transition_monthly', 'ai_career_radar_monthly')
  order by s.created_at desc
  limit 1;

  if sub.id is not null and sub.current_period_end > now() then
    subscription_id := sub.id;
    product_key := sub.product_key;
    period_end := sub.current_period_end;
    period_start := sub.current_period_end - interval '1 month';
    return next;
    return;
  end if;

  if ent.subscription_expires_at is not null and ent.subscription_expires_at > now() then
    subscription_id := sub.id;
    product_key := coalesce(sub.product_key, 'ai_career_transition_monthly');
    period_end := ent.subscription_expires_at;
    period_start := ent.subscription_expires_at - interval '1 month';
    return next;
  end if;

  return;
end;
$$;

-- Get or create usage row for current billing period
create or replace function public.get_or_create_monthly_usage(p_user_id uuid)
returns public.subscription_usage
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_id uuid;
  sub_period_start timestamptz;
  sub_period_end timestamptz;
  usage_row public.subscription_usage;
begin
  select t.subscription_id, t.period_start, t.period_end
  into sub_id, sub_period_start, sub_period_end
  from public.get_active_transition_subscription(p_user_id) t
  limit 1;

  if sub_period_end is null then
    return null;
  end if;

  select * into usage_row
  from public.subscription_usage
  where user_id = p_user_id
    and month_start = sub_period_start
  limit 1;

  if usage_row.id is not null then
    return usage_row;
  end if;

  insert into public.subscription_usage (
    user_id,
    subscription_id,
    month_start,
    month_end,
    career_scans_used,
    career_xrays_used,
    goal_switches_used
  )
  values (
    p_user_id,
    sub_id,
    sub_period_start,
    sub_period_end,
    0,
    0,
    0
  )
  on conflict (user_id, month_start) do update
  set updated_at = now()
  returning * into usage_row;

  return usage_row;
end;
$$;

create or replace function public.increment_subscription_usage(
  p_user_id uuid,
  p_field text
)
returns public.subscription_usage
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_row public.subscription_usage;
begin
  usage_row := public.get_or_create_monthly_usage(p_user_id);

  if usage_row.id is null then
    raise exception 'no active subscription usage period';
  end if;

  if p_field = 'career_scans_used' then
    update public.subscription_usage
    set career_scans_used = career_scans_used + 1
    where id = usage_row.id
    returning * into usage_row;
  elsif p_field = 'career_xrays_used' then
    update public.subscription_usage
    set career_xrays_used = career_xrays_used + 1
    where id = usage_row.id
    returning * into usage_row;
  elsif p_field = 'goal_switches_used' then
    update public.subscription_usage
    set goal_switches_used = goal_switches_used + 1
    where id = usage_row.id
    returning * into usage_row;
  else
    raise exception 'invalid usage field: %', p_field;
  end if;

  return usage_row;
end;
$$;

-- Fulfill checkout: transition subscription + usage row
create or replace function public.register_transition_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.purchases (
    user_id,
    product_id,
    status,
    amount_cents,
    stripe_checkout_session_id
  )
  values (uid, 'ai_career_transition_monthly', 'pending', 999, trim(p_stripe_session_id))
  on conflict (stripe_checkout_session_id) do nothing;
end;
$$;

create or replace function public.fulfill_transition_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  purchase_id uuid;
  period_end timestamptz;
  period_start timestamptz;
  sub_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select id into purchase_id
  from public.purchases
  where stripe_checkout_session_id = trim(p_stripe_session_id)
    and user_id = uid
    and product_id in ('ai_career_transition_monthly', 'radar')
  limit 1;

  if purchase_id is null then
    raise exception 'checkout session not found';
  end if;

  update public.purchases
  set status = 'completed', updated_at = now()
  where id = purchase_id
    and status <> 'completed';

  period_end := now() + interval '1 month';
  period_start := now();

  insert into public.user_entitlements (user_id, has_radar, subscription_expires_at)
  values (uid, true, period_end)
  on conflict (user_id) do update
  set has_radar = true,
      subscription_expires_at = excluded.subscription_expires_at,
      updated_at = now();

  update public.subscriptions
  set
    product_key = 'ai_career_transition_monthly',
    status = 'active',
    current_period_end = period_end,
    updated_at = now()
  where user_id = uid
    and status = 'active'
  returning id into sub_id;

  if sub_id is null then
    insert into public.subscriptions (user_id, product_key, status, current_period_end)
    values (uid, 'ai_career_transition_monthly', 'active', period_end)
    returning id into sub_id;
  end if;

  insert into public.subscription_usage (
    user_id,
    subscription_id,
    month_start,
    month_end
  )
  values (uid, sub_id, period_start, period_end)
  on conflict (user_id, month_start) do nothing;
end;
$$;

-- Backward-compatible aliases
create or replace function public.register_radar_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.register_transition_checkout(p_stripe_session_id);
end;
$$;

create or replace function public.fulfill_radar_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.fulfill_transition_checkout(p_stripe_session_id);
end;
$$;

revoke all on function public.get_active_transition_subscription(uuid) from public;
revoke all on function public.get_or_create_monthly_usage(uuid) from public;
revoke all on function public.increment_subscription_usage(uuid, text) from public;
revoke all on function public.register_transition_checkout(text) from public;
revoke all on function public.fulfill_transition_checkout(text) from public;

grant execute on function public.get_active_transition_subscription(uuid) to authenticated;
grant execute on function public.get_or_create_monthly_usage(uuid) to authenticated;
grant execute on function public.increment_subscription_usage(uuid, text) to authenticated;
grant execute on function public.register_transition_checkout(text) to authenticated;
grant execute on function public.fulfill_transition_checkout(text) to authenticated;

commit;
