-- Scan-based access model: career_xrays per scan, usage_limits, subscriptions
begin;

do $$ begin
  create type public.xray_access_type as enum ('one_time_purchase', 'radar_subscription');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.career_xray_status as enum ('pending_payment', 'paid', 'generated', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.usage_action_type as enum ('free_scan');
exception when duplicate_object then null;
end $$;

-- Denormalized scan fields (app maps scan_inputs + result for legacy rows)
alter table public.career_scans
  add column if not exists current_role text,
  add column if not exists target_role text,
  add column if not exists industry text,
  add column if not exists years_experience text,
  add column if not exists skills text,
  add column if not exists tools text,
  add column if not exists career_goal text,
  add column if not exists work_preference public.work_preference,
  add column if not exists free_result_json jsonb,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists career_scans_updated_at on public.career_scans;
create trigger career_scans_updated_at
  before update on public.career_scans
  for each row execute function public.set_updated_at();

create table if not exists public.career_xrays (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  access_type public.xray_access_type not null,
  status public.career_xray_status not null default 'pending_payment',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  xray_result_json jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id)
);

create index if not exists career_xrays_user_created_idx
  on public.career_xrays (user_id, created_at desc);

create index if not exists career_xrays_scan_idx
  on public.career_xrays (scan_id);

drop trigger if exists career_xrays_updated_at on public.career_xrays;
create trigger career_xrays_updated_at
  before update on public.career_xrays
  for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null default 'ai_career_radar_monthly',
  status public.subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_type public.usage_action_type not null default 'free_scan',
  window_start timestamptz not null,
  window_end timestamptz not null,
  count integer not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, action_type, window_start)
);

create index if not exists usage_limits_user_action_idx
  on public.usage_limits (user_id, action_type, window_end desc);

drop trigger if exists usage_limits_updated_at on public.usage_limits;
create trigger usage_limits_updated_at
  before update on public.usage_limits
  for each row execute function public.set_updated_at();

-- RLS: career_xrays
alter table public.career_xrays enable row level security;
alter table public.career_xrays force row level security;

drop policy if exists "career_xrays_select_own" on public.career_xrays;
create policy "career_xrays_select_own"
  on public.career_xrays for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "career_xrays_insert_own" on public.career_xrays;
create policy "career_xrays_insert_own"
  on public.career_xrays for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "career_xrays_update_own" on public.career_xrays;
create policy "career_xrays_update_own"
  on public.career_xrays for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS: subscriptions (read-only for clients)
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

-- RLS: usage_limits
alter table public.usage_limits enable row level security;
alter table public.usage_limits force row level security;

drop policy if exists "usage_limits_select_own" on public.usage_limits;
create policy "usage_limits_select_own"
  on public.usage_limits for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "usage_limits_insert_own" on public.usage_limits;
create policy "usage_limits_insert_own"
  on public.usage_limits for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "usage_limits_update_own" on public.usage_limits;
create policy "usage_limits_update_own"
  on public.usage_limits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into public.products (id, name, description, price_cents, price_interval, stripe_price_id, sort_order)
values (
  'career_xray_one_time',
  'Career X-Ray',
  'One-time Career X-Ray for a specific scan',
  199,
  'one_time',
  'price_1TfxtpBxBGNjOmXM5gLLn0QZ',
  1
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

commit;
