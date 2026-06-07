-- Add is_premium to public.profiles (free tier default)
-- Safe to re-run: uses IF NOT EXISTS and backfills before NOT NULL enforcement.

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    raise exception 'public.profiles does not exist. Run base profile migrations first.';
  end if;
end $$;

-- Add column when missing (existing + new users default to free tier)
alter table public.profiles
  add column if not exists is_premium boolean not null default false;

-- Backfill any legacy NULL values before enforcing NOT NULL
update public.profiles
set is_premium = false
where is_premium is null;

-- Enforce NOT NULL + default for TypeScript contract consistency
alter table public.profiles
  alter column is_premium set default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_premium'
      and is_nullable = 'YES'
  ) then
    alter table public.profiles
      alter column is_premium set not null;
  end if;
end $$;

comment on column public.profiles.is_premium is
  'Premium subscription flag. Defaults to false (free tier). Updated by Stripe checkout webhook.';

-- -----------------------------------------------------------------------------
-- How to run this in Supabase SQL Editor (live database)
-- -----------------------------------------------------------------------------
-- 1. Open https://supabase.com/dashboard → your project → SQL → New query
-- 2. Paste this entire file (or only the SQL above this comment block)
-- 3. Click Run (or Cmd/Ctrl + Enter)
-- 4. Confirm success in the Results panel — no errors should appear
-- 5. Optional verify:
--      select column_name, data_type, is_nullable, column_default
--      from information_schema.columns
--      where table_schema = 'public'
--        and table_name = 'profiles'
--        and column_name = 'is_premium';
--    Expected: boolean | NO | false
-- -----------------------------------------------------------------------------
