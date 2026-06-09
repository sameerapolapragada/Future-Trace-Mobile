-- Career X-Ray snapshots: one row per one-time purchase (not a permanent entitlement)
begin;

do $$ begin
  create type public.xray_snapshot_status as enum (
    'draft',
    'pending_payment',
    'paid',
    'generated',
    'failed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.career_xray_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  "current_role" text not null,
  target_role text not null,
  industry text,
  years_experience text,
  skills_snapshot text,
  tools_snapshot text,
  career_goal text,
  work_preference public.work_preference,
  scan_input_hash text not null,
  status public.xray_snapshot_status not null default 'draft',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  xray_result_json jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_xray_snapshots_user_created_idx
  on public.career_xray_snapshots (user_id, created_at desc);

create index if not exists career_xray_snapshots_user_status_idx
  on public.career_xray_snapshots (user_id, status);

drop trigger if exists career_xray_snapshots_updated_at on public.career_xray_snapshots;
create trigger career_xray_snapshots_updated_at
  before update on public.career_xray_snapshots
  for each row execute function public.set_updated_at();

-- RLS
alter table public.career_xray_snapshots enable row level security;
alter table public.career_xray_snapshots force row level security;

drop policy if exists "career_xray_snapshots_select_own" on public.career_xray_snapshots;
create policy "career_xray_snapshots_select_own"
  on public.career_xray_snapshots for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "career_xray_snapshots_insert_own" on public.career_xray_snapshots;
create policy "career_xray_snapshots_insert_own"
  on public.career_xray_snapshots for insert to authenticated
  with check (
    user_id = auth.uid()
    and status in ('draft', 'pending_payment')
  );

drop policy if exists "career_xray_snapshots_update_own_draft" on public.career_xray_snapshots;
create policy "career_xray_snapshots_update_own_draft"
  on public.career_xray_snapshots for update to authenticated
  using (
    user_id = auth.uid()
    and status in ('draft', 'pending_payment', 'paid', 'failed')
  )
  with check (user_id = auth.uid());

-- Seed snapshot product for Stripe (BFF references product_key career_xray_snapshot)
insert into public.products (id, name, description, price_cents, price_interval, stripe_price_id, sort_order)
values (
  'career_xray_snapshot',
  'Career X-Ray Snapshot',
  'One-time career snapshot comparing current role to target role',
  199,
  'one_time',
  'price_1TfxtpBxBGNjOmXM5gLLn0QZ',
  1
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  price_interval = excluded.price_interval;

commit;
