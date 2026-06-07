-- Future Trace Mobile — career intelligence schema
-- Implements docs/DATABASE_DESIGN.md (tables, constraints, indexes)
-- Requires: auth.users (Supabase Auth)

begin;

create extension if not exists "pgcrypto";

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
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.exposure_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.risk_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.work_preference as enum ('technical', 'business', 'hybrid');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_profile_source as enum ('scan_form', 'profile_edit', 'inferred');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.generation_status as enum ('queued', 'processing', 'complete', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_type as enum ('technical', 'soft', 'tool', 'domain');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.role_alias_source as enum ('onet', 'manual', 'llm_normalized');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.geo_region_type as enum ('national', 'state', 'metro');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.data_refresh_cadence as enum ('weekly', 'monthly', 'quarterly', 'annual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.salary_methodology as enum ('weighted_median', 'bls_only', 'blended', 'llm_estimate');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.role_trend as enum ('rising', 'stable', 'declining');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transition_difficulty as enum ('low', 'moderate', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_gap_level as enum ('small_gap', 'moderate_gap', 'large_gap');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.skill_impact_level as enum ('medium_impact', 'high_impact');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.radar_signal_category as enum (
    'high_growth', 'stable', 'declining', 'emerging'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trend_direction as enum ('up', 'down', 'flat');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.llm_job_type as enum (
    'career_scan', 'xray', 'role_intel', 'radar_refresh'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.llm_job_status as enum ('queued', 'processing', 'complete', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.integration_job_type as enum (
    'salary_pull', 'demand_pull', 'onet_sync', 'skill_momentum_pull'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sync_run_status as enum ('running', 'success', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.title_resolver as enum ('rules', 'llm', 'manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.consent_type as enum ('terms', 'privacy', 'marketing', 'analytics');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.purchase_status as enum (
    'pending', 'completed', 'failed', 'refunded'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum (
    'active', 'trialing', 'past_due', 'canceled', 'incomplete'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.salary_adjustment_reason as enum (
    'skill_premium', 'automation_discount', 'demand_surge', 'regulatory_premium'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.radar_insight_section as enum (
    'market_trajectory',
    'skill_gap_changes',
    'emerging_skills',
    'role_demand_signals',
    'personalized_alerts'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users — aligns with Future-Trace compliance layer)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  full_name text,
  avatar_url text,
  job_role text,
  stripe_customer_id text,
  onboarding_completed_at timestamptz,
  terms_accepted_at timestamptz,
  privacy_policy_version text,
  is_premium boolean not null default false,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_policy_version text;
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_domain_id uuid references public.domains (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists domains_updated_at on public.domains;
create trigger domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain_id uuid references public.domains (id) on delete set null,
  early_ai_use text,
  current_ai_use text,
  agentic_ai_future text,
  main_opportunity text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.industries add column if not exists domain_id uuid references public.domains (id) on delete set null;

drop trigger if exists industries_updated_at on public.industries;
create trigger industries_updated_at
  before update on public.industries
  for each row execute function public.set_updated_at();

create table if not exists public.occupation_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  soc_code text,
  onet_code text,
  role_family text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists occupation_roles_updated_at on public.occupation_roles;
create trigger occupation_roles_updated_at
  before update on public.occupation_roles
  for each row execute function public.set_updated_at();

create table if not exists public.role_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_text text not null,
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  match_confidence numeric(5, 4) not null default 1.0
    check (match_confidence >= 0 and match_confidence <= 1),
  source public.role_alias_source not null default 'manual',
  created_at timestamptz not null default now(),
  unique (alias_text, occupation_role_id)
);

create index if not exists role_aliases_alias_text_idx
  on public.role_aliases (lower(alias_text));

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  skill_type public.skill_type not null default 'technical',
  onet_element_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

create table if not exists public.role_skills (
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  importance smallint not null default 50 check (importance >= 0 and importance <= 100),
  level_required smallint not null default 50 check (level_required >= 0 and level_required <= 100),
  is_emerging boolean not null default false,
  primary key (occupation_role_id, skill_id)
);

create table if not exists public.role_adjacency (
  from_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  to_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  relationship_type text not null default 'adjacent',
  weight numeric(5, 2) not null default 1.0 check (weight >= 0),
  primary key (from_role_id, to_role_id),
  check (from_role_id <> to_role_id)
);

-- Minimal milestones for AI evolution FKs (extend with editorial content later)
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  period_label text,
  period_start_year integer,
  period_end_year integer,
  short_description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists milestones_updated_at on public.milestones;
create trigger milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

create table if not exists public.ai_evolution_eras (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- User career state
-- ---------------------------------------------------------------------------
create table if not exists public.user_career_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_job_title_raw text,
  current_role_id uuid references public.occupation_roles (id) on delete set null,
  industry_raw text,
  industry_id uuid references public.industries (id) on delete set null,
  domain_id uuid references public.domains (id) on delete set null,
  years_experience smallint check (years_experience is null or (years_experience >= 0 and years_experience <= 60)),
  work_preference public.work_preference,
  career_goal_text text,
  focus_area text,
  updated_at timestamptz not null default now()
);

drop trigger if exists user_career_profiles_updated_at on public.user_career_profiles;
create trigger user_career_profiles_updated_at
  before update on public.user_career_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid references public.skills (id) on delete set null,
  label_raw text not null,
  is_tool boolean not null default false,
  proficiency smallint check (proficiency is null or (proficiency >= 0 and proficiency <= 100)),
  source public.skill_profile_source not null default 'profile_edit',
  created_at timestamptz not null default now(),
  unique (user_id, label_raw, is_tool)
);

create index if not exists user_skills_user_id_idx on public.user_skills (user_id);

-- ---------------------------------------------------------------------------
-- Products, entitlements, billing
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  price_interval text not null default 'one_time',
  stripe_price_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_scans_remaining integer not null default 1 check (free_scans_remaining >= 0),
  has_career_xray boolean not null default false,
  xray_unlocked_at timestamptz,
  xray_source_scan_id uuid,
  has_radar boolean not null default false,
  radar_subscription_id uuid,
  subscription_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists user_entitlements_updated_at on public.user_entitlements;
create trigger user_entitlements_updated_at
  before update on public.user_entitlements
  for each row execute function public.set_updated_at();

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id),
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_status_idx
  on public.user_subscriptions (user_id, status);

drop trigger if exists user_subscriptions_updated_at on public.user_subscriptions;
create trigger user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

alter table public.user_entitlements
  drop constraint if exists user_entitlements_radar_subscription_id_fkey;

alter table public.user_entitlements
  add constraint user_entitlements_radar_subscription_id_fkey
  foreign key (radar_subscription_id) references public.user_subscriptions (id) on delete set null;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id),
  status public.purchase_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  grants_xray_for_scan_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);

drop trigger if exists purchases_updated_at on public.purchases;
create trigger purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type public.consent_type not null,
  policy_version text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  ip_hash text
);

create index if not exists user_consents_user_type_idx
  on public.user_consents (user_id, consent_type, granted_at desc);

-- ---------------------------------------------------------------------------
-- LLM orchestration (created before scans for FK)
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  version text not null,
  system_prompt text not null,
  schema_version text not null default '1',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (feature, version)
);

create table if not exists public.llm_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type public.llm_job_type not null,
  user_id uuid references auth.users (id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  model text not null default 'gemini-1.5-flash',
  prompt_version text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  status public.llm_job_status not null default 'queued',
  error_message text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists llm_jobs_user_created_idx
  on public.llm_jobs (user_id, created_at desc);

create index if not exists llm_jobs_entity_idx
  on public.llm_jobs (related_entity_type, related_entity_id);

-- ---------------------------------------------------------------------------
-- Market facts layer
-- ---------------------------------------------------------------------------
create table if not exists public.geo_markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code char(2) not null default 'US',
  region_type public.geo_region_type not null default 'national',
  bls_area_code text,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  reliability_tier smallint not null default 2 check (reliability_tier >= 1 and reliability_tier <= 3),
  refresh_cadence public.data_refresh_cadence not null default 'monthly',
  api_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.salary_observations (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  industry_id uuid references public.industries (id) on delete set null,
  geo_market_id uuid not null references public.geo_markets (id) on delete restrict,
  source_id uuid not null references public.data_sources (id) on delete restrict,
  observed_at date not null,
  ingested_at timestamptz not null default now(),
  currency char(3) not null default 'USD',
  percentile_10_cents integer check (percentile_10_cents is null or percentile_10_cents >= 0),
  percentile_25_cents integer check (percentile_25_cents is null or percentile_25_cents >= 0),
  median_cents integer check (median_cents is null or median_cents >= 0),
  percentile_75_cents integer check (percentile_75_cents is null or percentile_75_cents >= 0),
  percentile_90_cents integer check (percentile_90_cents is null or percentile_90_cents >= 0),
  sample_size integer check (sample_size is null or sample_size >= 0),
  employment_count integer check (employment_count is null or employment_count >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  external_id text not null,
  confidence_score numeric(4, 3) not null default 1.0
    check (confidence_score >= 0 and confidence_score <= 1),
  unique (source_id, external_id)
);

create index if not exists salary_observations_lookup_idx
  on public.salary_observations (occupation_role_id, domain_id, geo_market_id, observed_at desc);

create index if not exists salary_observations_role_geo_idx
  on public.salary_observations (occupation_role_id, geo_market_id, observed_at desc);

create table if not exists public.role_salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  geo_market_id uuid not null references public.geo_markets (id) on delete restrict,
  effective_from date not null,
  effective_to date,
  entry_min_cents integer check (entry_min_cents is null or entry_min_cents >= 0),
  entry_max_cents integer check (entry_max_cents is null or entry_max_cents >= 0),
  mid_min_cents integer check (mid_min_cents is null or mid_min_cents >= 0),
  mid_max_cents integer check (mid_max_cents is null or mid_max_cents >= 0),
  senior_min_cents integer check (senior_min_cents is null or senior_min_cents >= 0),
  senior_max_cents integer check (senior_max_cents is null or senior_max_cents >= 0),
  display_range text not null,
  methodology public.salary_methodology not null default 'blended',
  source_observation_ids uuid[] not null default '{}'::uuid[],
  computed_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create index if not exists role_salary_benchmarks_active_idx
  on public.role_salary_benchmarks (occupation_role_id, domain_id, geo_market_id, effective_from desc)
  where effective_to is null;

create table if not exists public.role_demand_observations (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  geo_market_id uuid not null references public.geo_markets (id) on delete restrict,
  source_id uuid not null references public.data_sources (id) on delete restrict,
  observed_at date not null,
  openings_count integer check (openings_count is null or openings_count >= 0),
  openings_label text,
  demand_index smallint check (demand_index is null or (demand_index >= 0 and demand_index <= 100)),
  demand_tag text,
  yoy_change_pct numeric(6, 2),
  cagr_pct numeric(6, 2),
  raw_payload jsonb not null default '{}'::jsonb,
  ingested_at timestamptz not null default now()
);

create index if not exists role_demand_observations_lookup_idx
  on public.role_demand_observations (occupation_role_id, domain_id, geo_market_id, observed_at desc);

create table if not exists public.skill_momentum_observations (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  source_id uuid not null references public.data_sources (id) on delete restrict,
  observed_at date not null,
  growth_pct_label text,
  momentum_score numeric(6, 2),
  ingested_at timestamptz not null default now()
);

create index if not exists skill_momentum_observations_lookup_idx
  on public.skill_momentum_observations (skill_id, domain_id, observed_at desc);

create table if not exists public.market_signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  category public.radar_signal_category not null,
  impact public.risk_level not null default 'medium',
  trend public.trend_direction not null default 'flat',
  related_role_ids uuid[] not null default '{}'::uuid[],
  related_skill_ids uuid[] not null default '{}'::uuid[],
  related_milestone_id uuid references public.milestones (id) on delete set null,
  source_id uuid references public.data_sources (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_signals_published_idx
  on public.market_signals (published_at desc);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  domain_id uuid references public.domains (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  benchmark_ids uuid[] not null default '{}'::uuid[],
  milestone_id uuid references public.milestones (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists market_snapshots_date_idx
  on public.market_snapshots (snapshot_date desc, domain_id);

create table if not exists public.role_ai_exposure_snapshots (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  milestone_id uuid references public.milestones (id) on delete set null,
  as_of_date date not null,
  exposure_score smallint not null check (exposure_score >= 0 and exposure_score <= 100),
  exposure_level public.exposure_level not null,
  automation_risk_pct numeric(5, 2) check (automation_risk_pct is null or (automation_risk_pct >= 0 and automation_risk_pct <= 100)),
  augmentation_opportunity_pct numeric(5, 2),
  tasks_at_risk jsonb not null default '[]'::jsonb,
  source_id uuid references public.data_sources (id) on delete set null,
  methodology_version text not null default '1',
  created_at timestamptz not null default now()
);

create index if not exists role_ai_exposure_snapshots_lookup_idx
  on public.role_ai_exposure_snapshots (occupation_role_id, domain_id, as_of_date desc);

create table if not exists public.role_demand_ai_adjustments (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  milestone_id uuid references public.milestones (id) on delete set null,
  as_of_date date not null,
  baseline_demand_index smallint check (baseline_demand_index is null or (baseline_demand_index >= 0 and baseline_demand_index <= 100)),
  adjusted_demand_index smallint check (adjusted_demand_index is null or (adjusted_demand_index >= 0 and adjusted_demand_index <= 100)),
  demand_delta_pct numeric(6, 2),
  narrative text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_salary_ai_adjustments (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  geo_market_id uuid not null references public.geo_markets (id) on delete restrict,
  milestone_id uuid references public.milestones (id) on delete set null,
  as_of_date date not null,
  baseline_benchmark_id uuid references public.role_salary_benchmarks (id) on delete set null,
  adjusted_benchmark_id uuid references public.role_salary_benchmarks (id) on delete set null,
  salary_delta_pct numeric(6, 2),
  adjustment_reason public.salary_adjustment_reason,
  narrative text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_evolution_timeline (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid not null references public.occupation_roles (id) on delete cascade,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  headline text not null,
  body text not null,
  salary_delta_pct numeric(6, 2),
  demand_delta_pct numeric(6, 2),
  exposure_delta smallint,
  created_at timestamptz not null default now(),
  unique (occupation_role_id, milestone_id)
);

-- ---------------------------------------------------------------------------
-- Career scans
-- ---------------------------------------------------------------------------
create table if not exists public.career_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.generation_status not null default 'queued',
  input_hash text not null,
  prompt_version text,
  llm_job_id uuid references public.llm_jobs (id) on delete set null,
  resilience_score smallint check (resilience_score is null or (resilience_score >= 0 and resilience_score <= 100)),
  ai_exposure_score smallint check (ai_exposure_score is null or (ai_exposure_score >= 0 and ai_exposure_score <= 100)),
  ai_exposure_level public.exposure_level,
  risk_level public.risk_level,
  summary text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, input_hash)
);

create index if not exists career_scans_user_created_idx
  on public.career_scans (user_id, created_at desc);

alter table public.user_entitlements
  drop constraint if exists user_entitlements_xray_source_scan_id_fkey;

alter table public.user_entitlements
  add constraint user_entitlements_xray_source_scan_id_fkey
  foreign key (xray_source_scan_id) references public.career_scans (id) on delete set null;

alter table public.purchases
  drop constraint if exists purchases_grants_xray_for_scan_id_fkey;

alter table public.purchases
  add constraint purchases_grants_xray_for_scan_id_fkey
  foreign key (grants_xray_for_scan_id) references public.career_scans (id) on delete set null;

create table if not exists public.scan_inputs (
  scan_id uuid primary key references public.career_scans (id) on delete cascade,
  job_title_raw text not null,
  industry_raw text not null,
  years_experience smallint not null check (years_experience >= 0 and years_experience <= 60),
  current_skills_text text not null,
  tools_used_text text not null,
  career_goal_text text not null,
  work_preference public.work_preference not null,
  normalized_role_id uuid references public.occupation_roles (id) on delete set null,
  normalized_industry_id uuid references public.industries (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_strengths (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  label text not null,
  sort_order smallint not null default 0
);

create table if not exists public.scan_vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  label text not null,
  sort_order smallint not null default 0
);

create table if not exists public.scan_opportunity_zones (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  label text not null,
  sort_order smallint not null default 0
);

create table if not exists public.scan_transition_role_suggestions (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  occupation_role_id uuid references public.occupation_roles (id) on delete set null,
  rank smallint not null check (rank >= 1 and rank <= 10),
  title_snapshot text not null,
  match_score smallint check (match_score is null or (match_score >= 0 and match_score <= 100)),
  unique (scan_id, rank)
);

create table if not exists public.scan_generation_context (
  scan_id uuid primary key references public.career_scans (id) on delete cascade,
  market_snapshot_id uuid references public.market_snapshots (id) on delete set null,
  salary_benchmark_ids uuid[] not null default '{}'::uuid[],
  exposure_snapshot_ids uuid[] not null default '{}'::uuid[],
  demand_observation_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Career X-Ray
-- ---------------------------------------------------------------------------
create table if not exists public.xray_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  status public.generation_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  future_readiness_score smallint check (future_readiness_score is null or (future_readiness_score >= 0 and future_readiness_score <= 100)),
  top_role_id uuid references public.occupation_roles (id) on delete set null,
  market_outlook text,
  recommended_action text,
  prompt_version text,
  llm_job_id uuid references public.llm_jobs (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (scan_id)
);

create index if not exists xray_reports_user_created_idx
  on public.xray_reports (user_id, created_at desc);

create table if not exists public.xray_skill_gaps (
  id uuid primary key default gen_random_uuid(),
  xray_report_id uuid not null references public.xray_reports (id) on delete cascade,
  skill_id uuid references public.skills (id) on delete set null,
  skill_label text not null,
  gap_level public.skill_gap_level not null,
  impact_level public.skill_impact_level not null,
  benefit_text text not null,
  sort_order smallint not null default 0
);

create table if not exists public.xray_transition_matches (
  id uuid primary key default gen_random_uuid(),
  xray_report_id uuid not null references public.xray_reports (id) on delete cascade,
  occupation_role_id uuid not null references public.occupation_roles (id) on delete restrict,
  rank smallint not null check (rank >= 1 and rank <= 5),
  match_score smallint not null check (match_score >= 0 and match_score <= 100),
  difficulty public.transition_difficulty not null,
  transition_time_label text not null,
  why_it_fits text not null,
  trend public.role_trend not null default 'stable',
  salary_benchmark_id uuid references public.role_salary_benchmarks (id) on delete set null,
  salary_display text not null,
  unique (xray_report_id, rank)
);

create table if not exists public.role_intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  xray_report_id uuid references public.xray_reports (id) on delete cascade,
  occupation_role_id uuid not null references public.occupation_roles (id) on delete restrict,
  slug text not null,
  payload jsonb not null default '{}'::jsonb,
  match_score smallint check (match_score is null or (match_score >= 0 and match_score <= 100)),
  salary_benchmark_id uuid references public.role_salary_benchmarks (id) on delete set null,
  demand_observation_id uuid references public.role_demand_observations (id) on delete set null,
  expires_at timestamptz,
  is_cached_template boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists role_intelligence_reports_slug_idx
  on public.role_intelligence_reports (slug, expires_at desc);

create unique index if not exists role_intelligence_reports_user_role_idx
  on public.role_intelligence_reports (user_id, occupation_role_id, xray_report_id)
  where user_id is not null and is_cached_template = false;

-- ---------------------------------------------------------------------------
-- AI Career Radar
-- ---------------------------------------------------------------------------
create table if not exists public.radar_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid not null references public.career_scans (id) on delete cascade,
  xray_report_id uuid references public.xray_reports (id) on delete set null,
  period_start date not null,
  period_end date not null,
  readiness_score smallint check (readiness_score is null or (readiness_score >= 0 and readiness_score <= 100)),
  readiness_label text,
  peer_percentile_label text,
  score_trend_label text,
  payload jsonb not null default '{}'::jsonb,
  insights_payload jsonb not null default '{}'::jsonb,
  market_snapshot_id uuid references public.market_snapshots (id) on delete set null,
  prompt_version text,
  llm_job_id uuid references public.llm_jobs (id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index if not exists radar_snapshots_user_period_idx
  on public.radar_snapshots (user_id, period_start desc);

create table if not exists public.radar_sub_metrics (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.radar_snapshots (id) on delete cascade,
  label text not null,
  value smallint not null check (value >= 0 and value <= 100),
  bar_class text,
  sort_order smallint not null default 0
);

create table if not exists public.radar_skill_gap_progress (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.radar_snapshots (id) on delete cascade,
  previous_snapshot_id uuid references public.radar_snapshots (id) on delete set null,
  skill_id uuid references public.skills (id) on delete set null,
  skill_label text not null,
  current_pct smallint not null check (current_pct >= 0 and current_pct <= 100),
  target_pct smallint not null check (target_pct >= 0 and target_pct <= 100),
  sort_order smallint not null default 0
);

create table if not exists public.radar_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  snapshot_id uuid references public.radar_snapshots (id) on delete cascade,
  title text not null,
  summary text not null,
  category public.radar_signal_category not null,
  impact public.risk_level not null default 'medium',
  trend public.trend_direction not null default 'flat',
  signal_date date not null default current_date,
  source_signal_id uuid references public.market_signals (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists radar_signals_user_date_idx
  on public.radar_signals (user_id, signal_date desc);

create table if not exists public.radar_insight_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.radar_snapshots (id) on delete cascade,
  section_type public.radar_insight_section not null,
  title text not null,
  summary text not null,
  category public.radar_signal_category,
  impact public.risk_level,
  trend public.trend_direction,
  sort_order smallint not null default 0
);

create table if not exists public.radar_monthly_diffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_snapshot_id uuid not null references public.radar_snapshots (id) on delete cascade,
  to_snapshot_id uuid not null references public.radar_snapshots (id) on delete cascade,
  readiness_delta smallint,
  skill_gap_deltas jsonb not null default '{}'::jsonb,
  salary_band_changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (from_snapshot_id, to_snapshot_id)
);

-- ---------------------------------------------------------------------------
-- ETL & integration
-- ---------------------------------------------------------------------------
create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.data_sources (id) on delete cascade,
  job_type public.integration_job_type not null,
  schedule_cron text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.integration_sync_jobs (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.sync_run_status not null default 'running',
  rows_inserted integer not null default 0 check (rows_inserted >= 0),
  error_message text,
  cursor text
);

create table if not exists public.integration_staging_raw (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.data_sources (id) on delete cascade,
  fetched_at timestamptz not null default now(),
  payload jsonb not null,
  processed_at timestamptz
);

create index if not exists integration_staging_raw_unprocessed_idx
  on public.integration_staging_raw (fetched_at)
  where processed_at is null;

create table if not exists public.title_normalization_requests (
  id uuid primary key default gen_random_uuid(),
  raw_title text not null,
  resolved_role_id uuid references public.occupation_roles (id) on delete set null,
  confidence numeric(5, 4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  resolver public.title_resolver not null default 'rules',
  created_at timestamptz not null default now()
);

create table if not exists public.content_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  payload jsonb not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists content_cache_expires_idx
  on public.content_cache (expires_at)
  where expires_at is not null;

-- ---------------------------------------------------------------------------
-- Compliance audit (immutable; target_profile_id intentionally no FK)
-- ---------------------------------------------------------------------------
create table if not exists public.compliance_logs (
  id uuid primary key default gen_random_uuid(),
  action_performed text not null,
  target_profile_id uuid,
  timestamp timestamptz not null default now()
);

create index if not exists compliance_logs_target_ts_idx
  on public.compliance_logs (target_profile_id, timestamp desc);

-- ---------------------------------------------------------------------------
-- Rate limits & anonymized aggregates
-- ---------------------------------------------------------------------------
create table if not exists public.scan_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  ip_hash text,
  window_start timestamptz not null,
  scan_count integer not null default 0 check (scan_count >= 0),
  check (user_id is not null or ip_hash is not null)
);

create index if not exists scan_rate_limits_user_window_idx
  on public.scan_rate_limits (user_id, window_start desc);

create table if not exists public.analytics_career_scan_aggregates (
  id uuid primary key default gen_random_uuid(),
  occupation_role_id uuid references public.occupation_roles (id) on delete set null,
  domain_id uuid references public.domains (id) on delete set null,
  period_month date not null,
  resilience_score_avg numeric(5, 2),
  sample_count integer not null default 0 check (sample_count >= 0),
  created_at timestamptz not null default now(),
  unique (occupation_role_id, domain_id, period_month)
);

commit;
