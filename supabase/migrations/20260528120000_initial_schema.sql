-- Future Trace: initial schema (mobile MVP + content)
-- Apply via Supabase dev branch / GitHub Dev — not production until promoted.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (idempotent — safe when re-running after partial apply)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.impact_level as enum (
    'foundational', 'high', 'transformative', 'revolutionary'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.timeline_dot_color as enum ('grey', 'blue', 'purple');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.exposure_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum (
    'active', 'trialing', 'past_due', 'canceled', 'incomplete'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_role as enum ('user', 'editor', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.platform_surface as enum ('web', 'mobile', 'all');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans & billing (reference data)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  label text not null,
  tagline text not null,
  price_cents integer not null default 0,
  price_interval text not null default 'month',
  stripe_price_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create table if not exists public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.plans (id) on delete cascade,
  feature_text text not null,
  sort_order integer not null default 0
);

create index if not exists plan_features_plan_id_idx on public.plan_features (plan_id, sort_order);

-- ---------------------------------------------------------------------------
-- User profiles (extends auth.users — no duplicate users table)
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role public.user_role not null default 'user',
  is_guest boolean not null default false,
  default_industry_id uuid,
  experience_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id, status);

-- ---------------------------------------------------------------------------
-- Industries & job exposure taxonomy
-- ---------------------------------------------------------------------------
create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  early_ai_use text not null,
  current_ai_use text not null,
  agentic_ai_future text not null,
  main_opportunity text not null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists industries_updated_at on public.industries;
create trigger industries_updated_at
  before update on public.industries
  for each row execute function public.set_updated_at();

create table if not exists public.industry_risks (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references public.industries (id) on delete cascade,
  risk_text text not null,
  sort_order integer not null default 0
);

create index if not exists industry_risks_industry_id_idx on public.industry_risks (industry_id, sort_order);

create table if not exists public.job_exposure_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  sort_order integer not null default 0
);

create table if not exists public.job_exposure_examples (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.job_exposure_groups (id) on delete cascade,
  role_title text not null,
  note text,
  sort_order integer not null default 0
);

create index if not exists job_exposure_examples_group_id_idx on public.job_exposure_examples (group_id, sort_order);

-- ---------------------------------------------------------------------------
-- AI evolution timeline
-- ---------------------------------------------------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  era text,
  period_label text not null,
  period_start_year integer,
  period_end_year integer,
  short_description text not null,
  summary text,
  why_it_mattered text,
  future_implication text,
  technology_category text,
  impact_badge text,
  impact_level public.impact_level,
  dot_color public.timeline_dot_color,
  technical_breakthrough text,
  looking_forward text,
  tag_theme text,
  period_color text,
  next_milestone_id uuid references public.milestones (id) on delete set null,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists milestones_updated_at on public.milestones;
create trigger milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

create index if not exists milestones_status_sort_idx on public.milestones (status, sort_order);
create index if not exists milestones_period_idx on public.milestones (period_start_year, period_end_year);

create table if not exists public.milestone_display (
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  surface public.platform_surface not null,
  is_visible boolean not null default true,
  sort_order integer,
  primary key (milestone_id, surface)
);

create table if not exists public.milestone_sections (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  section_type text not null,
  title text,
  subtitle text,
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists milestone_sections_milestone_id_idx on public.milestone_sections (milestone_id, sort_order);

create table if not exists public.milestone_sources (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  label text not null,
  url text not null,
  source_type text,
  published_year integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists milestone_sources_milestone_id_idx on public.milestone_sources (milestone_id, sort_order);

create table if not exists public.milestone_industry_tags (
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  industry_name text not null,
  primary key (milestone_id, industry_name)
);

create table if not exists public.milestone_job_tags (
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  job_title text not null,
  primary key (milestone_id, job_title)
);

-- ---------------------------------------------------------------------------
-- Score jobs & exposure results
-- ---------------------------------------------------------------------------
create table if not exists public.score_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  default_industry_id uuid references public.industries (id) on delete set null,
  default_industry_name text,
  is_popular boolean not null default false,
  is_trending boolean not null default false,
  search_volume_label text,
  trending_rank integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists score_jobs_updated_at on public.score_jobs;
create trigger score_jobs_updated_at
  before update on public.score_jobs
  for each row execute function public.set_updated_at();

create table if not exists public.exposure_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  score_job_id uuid references public.score_jobs (id) on delete set null,
  job_title_snapshot text not null,
  industry_snapshot text,
  score smallint not null check (score >= 0 and score <= 100),
  exposure_level public.exposure_level not null,
  summary text not null,
  suggestions jsonb not null default '[]'::jsonb,
  algorithm_version text not null default 'v1-heuristic',
  created_at timestamptz not null default now()
);

create index if not exists exposure_scores_user_created_idx on public.exposure_scores (user_id, created_at desc);
create index if not exists exposure_scores_job_idx on public.exposure_scores (score_job_id);

-- ---------------------------------------------------------------------------
-- Home feed & search
-- ---------------------------------------------------------------------------
create table if not exists public.content_feed_items (
  id uuid primary key default gen_random_uuid(),
  feed_type text not null,
  tag text,
  title text not null,
  summary text not null,
  category text,
  impact_label text,
  milestone_id uuid references public.milestones (id) on delete set null,
  external_url text,
  published_at timestamptz not null default now(),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists content_feed_items_feed_published_idx on public.content_feed_items (feed_type, published_at desc);

create table if not exists public.app_metadata (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.search_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  milestone_id uuid references public.milestones (id) on delete set null,
  topic_type text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create index if not exists search_topics_type_sort_idx on public.search_topics (topic_type, sort_order);

create table if not exists public.user_recent_searches (
  user_id uuid not null references auth.users (id) on delete cascade,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  searched_at timestamptz not null default now(),
  primary key (user_id, milestone_id)
);

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  );

  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.industries enable row level security;
alter table public.industry_risks enable row level security;
alter table public.job_exposure_groups enable row level security;
alter table public.job_exposure_examples enable row level security;
alter table public.milestones enable row level security;
alter table public.milestone_display enable row level security;
alter table public.milestone_sections enable row level security;
alter table public.milestone_sources enable row level security;
alter table public.milestone_industry_tags enable row level security;
alter table public.milestone_job_tags enable row level security;
alter table public.score_jobs enable row level security;
alter table public.exposure_scores enable row level security;
alter table public.content_feed_items enable row level security;
alter table public.app_metadata enable row level security;
alter table public.search_topics enable row level security;
alter table public.user_recent_searches enable row level security;

-- Public read: published content & active plans
drop policy if exists "plans_select_all" on public.plans;
create policy "plans_select_all"
  on public.plans for select
  using (is_active = true);

drop policy if exists "plan_features_select_all" on public.plan_features;
create policy "plan_features_select_all"
  on public.plan_features for select
  using (true);

drop policy if exists "industries_select_published" on public.industries;
create policy "industries_select_published"
  on public.industries for select
  using (status = 'published');

drop policy if exists "industry_risks_select_published" on public.industry_risks;
create policy "industry_risks_select_published"
  on public.industry_risks for select
  using (
    exists (
      select 1 from public.industries i
      where i.id = industry_id and i.status = 'published'
    )
  );

drop policy if exists "job_groups_select_all" on public.job_exposure_groups;
create policy "job_groups_select_all"
  on public.job_exposure_groups for select
  using (true);

drop policy if exists "job_examples_select_all" on public.job_exposure_examples;
create policy "job_examples_select_all"
  on public.job_exposure_examples for select
  using (true);

drop policy if exists "milestones_select_published" on public.milestones;
create policy "milestones_select_published"
  on public.milestones for select
  using (status = 'published' and deleted_at is null);

drop policy if exists "milestone_display_select_visible" on public.milestone_display;
create policy "milestone_display_select_visible"
  on public.milestone_display for select
  using (
    is_visible = true
    and exists (
      select 1 from public.milestones m
      where m.id = milestone_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  );

drop policy if exists "milestone_sections_select_published" on public.milestone_sections;
create policy "milestone_sections_select_published"
  on public.milestone_sections for select
  using (
    exists (
      select 1 from public.milestones m
      where m.id = milestone_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  );

drop policy if exists "milestone_sources_select_published" on public.milestone_sources;
create policy "milestone_sources_select_published"
  on public.milestone_sources for select
  using (
    exists (
      select 1 from public.milestones m
      where m.id = milestone_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  );

drop policy if exists "milestone_industry_tags_select_published" on public.milestone_industry_tags;
create policy "milestone_industry_tags_select_published"
  on public.milestone_industry_tags for select
  using (
    exists (
      select 1 from public.milestones m
      where m.id = milestone_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  );

drop policy if exists "milestone_job_tags_select_published" on public.milestone_job_tags;
create policy "milestone_job_tags_select_published"
  on public.milestone_job_tags for select
  using (
    exists (
      select 1 from public.milestones m
      where m.id = milestone_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  );

drop policy if exists "score_jobs_select_active" on public.score_jobs;
create policy "score_jobs_select_active"
  on public.score_jobs for select
  using (is_active = true);

drop policy if exists "content_feed_select_published" on public.content_feed_items;
create policy "content_feed_select_published"
  on public.content_feed_items for select
  using (status = 'published');

drop policy if exists "app_metadata_select_all" on public.app_metadata;
create policy "app_metadata_select_all"
  on public.app_metadata for select
  using (true);

drop policy if exists "search_topics_select_active" on public.search_topics;
create policy "search_topics_select_active"
  on public.search_topics for select
  using (is_active = true);

-- User-owned rows
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "exposure_scores_select_own" on public.exposure_scores;
create policy "exposure_scores_select_own"
  on public.exposure_scores for select
  using (auth.uid() = user_id);

drop policy if exists "exposure_scores_insert_own" on public.exposure_scores;
create policy "exposure_scores_insert_own"
  on public.exposure_scores for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "user_recent_searches_all_own" on public.user_recent_searches;
create policy "user_recent_searches_all_own"
  on public.user_recent_searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Full-text search helper index
create index if not exists milestones_fts_idx on public.milestones
  using gin (
    to_tsvector(
      'english',
      title || ' ' || short_description || ' ' || coalesce(summary, '')
    )
  );
