-- Pipeline test: GitHub Dev → Supabase persistent dev
-- Safe additive change — remove column later if not needed.

alter table public.plans
  add column if not exists description text;

comment on column public.plans.description is 'Optional longer plan copy for profile / paywall UI';

update public.plans
set description = tagline
where description is null;
