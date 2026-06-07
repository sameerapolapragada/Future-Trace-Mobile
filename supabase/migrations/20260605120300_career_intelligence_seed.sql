-- Reference seed data: products, geo markets, data sources, sample taxonomy

begin;

insert into public.products (id, name, description, price_cents, price_interval, sort_order)
values
  (
    'free-scan',
    'Career Resilience Scan',
    'Free snapshot of AI-era career resilience, exposure, and transition roles.',
    0,
    'one_time',
    0
  ),
  (
    'xray',
    'Career X-Ray',
    'One-time deep career scan with transition roles and skill gap analysis.',
    199,
    'one_time',
    1
  ),
  (
    'radar',
    'AI Career Radar',
    'Monthly career intelligence with market signals and skill gap movement.',
    999,
    'month',
    2
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  price_interval = excluded.price_interval,
  sort_order = excluded.sort_order;

insert into public.geo_markets (slug, country_code, region_type, name)
values
  ('us-national', 'US', 'national', 'United States (National)'),
  ('us-sf-bay', 'US', 'metro', 'San Francisco Bay Area'),
  ('us-dallas', 'US', 'metro', 'Dallas-Fort Worth')
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  region_type = excluded.region_type;

insert into public.data_sources (slug, name, reliability_tier, refresh_cadence)
values
  ('bls_oews', 'BLS Occupational Employment and Wage Statistics', 1, 'annual'),
  ('onet', 'O*NET Web Services', 1, 'monthly'),
  ('adzuna', 'Adzuna Job Market API', 2, 'weekly'),
  ('llm_estimate', 'LLM-generated estimate (low confidence)', 3, 'monthly'),
  ('manual', 'Manual editorial curation', 1, 'quarterly')
on conflict (slug) do update set
  name = excluded.name,
  reliability_tier = excluded.reliability_tier,
  refresh_cadence = excluded.refresh_cadence;

insert into public.domains (slug, name)
values
  ('healthcare-ops', 'Healthcare Operations'),
  ('enterprise-saas', 'Enterprise SaaS'),
  ('fintech', 'Financial Technology')
on conflict (slug) do update set name = excluded.name;

insert into public.industries (slug, name, domain_id, sort_order)
select
  v.slug,
  v.name,
  d.id,
  v.sort_order
from (
  values
    ('healthcare', 'Healthcare', 'healthcare-ops', 0),
    ('technology', 'Technology', 'enterprise-saas', 1),
    ('finance', 'Finance', 'fintech', 2)
) as v(slug, name, domain_slug, sort_order)
inner join public.domains d on d.slug = v.domain_slug
on conflict (slug) do update set
  name = excluded.name,
  domain_id = excluded.domain_id,
  sort_order = excluded.sort_order;

insert into public.occupation_roles (slug, title, role_family)
values
  ('salesforce-administrator', 'Salesforce Administrator', 'operations'),
  ('ai-operations-analyst', 'AI Operations Analyst', 'operations'),
  ('salesforce-architect', 'Salesforce Architect', 'engineering'),
  ('revops-manager', 'RevOps Manager', 'operations'),
  ('product-operations-manager', 'Product Operations Manager', 'operations'),
  ('ai-governance-analyst', 'AI Governance Analyst', 'operations')
on conflict (slug) do update set
  title = excluded.title,
  role_family = excluded.role_family;

insert into public.role_aliases (alias_text, occupation_role_id, match_confidence, source)
select
  v.alias_text,
  r.id,
  v.confidence,
  v.source::public.role_alias_source
from (
  values
    ('Salesforce Admin', 'salesforce-administrator', 0.95, 'manual'),
    ('SFDC Administrator', 'salesforce-administrator', 0.90, 'manual')
) as v(alias_text, role_slug, confidence, source)
inner join public.occupation_roles r on r.slug = v.role_slug
on conflict (alias_text, occupation_role_id) do nothing;

insert into public.skills (slug, name, skill_type)
values
  ('salesforce', 'Salesforce', 'tool'),
  ('flow-builder', 'Flow Builder', 'tool'),
  ('stakeholder-management', 'Stakeholder Management', 'soft'),
  ('ai-workflow-design', 'AI Workflow Design', 'technical'),
  ('data-governance', 'Data Governance', 'domain'),
  ('prompt-evaluation', 'Prompt Evaluation', 'technical'),
  ('python-programming', 'Python Programming', 'technical')
on conflict (slug) do update set
  name = excluded.name,
  skill_type = excluded.skill_type;

insert into public.milestones (slug, title, period_label, short_description, sort_order)
values
  (
    'copilot-era',
    'Copilot Era',
    '2023–2025',
    'Enterprise adoption of AI copilots across CRM, productivity, and ops workflows.',
    10
  ),
  (
    'agentic-ai',
    'Agentic AI',
    '2025–',
    'Multi-step AI agents entering enterprise stacks and reshaping role tasks.',
    20
  )
on conflict (slug) do update set
  title = excluded.title,
  period_label = excluded.period_label,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order;

commit;
