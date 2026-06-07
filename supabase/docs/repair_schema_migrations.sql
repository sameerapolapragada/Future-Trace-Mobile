-- =============================================================================
-- Fix: "Remote migration versions not found in local migrations directory"
-- Run on your Supabase branch (SQL Editor).
-- =============================================================================

-- STEP 1 — See what Supabase thinks is applied
select version, name, inserted_at
from supabase_migrations.schema_migrations
order by version;

-- STEP 2 — Orphan rows (version in DB but no matching file in git)
-- Update this list when adding migrations under supabase/migrations/
select s.version, s.name
from supabase_migrations.schema_migrations s
where s.version not in (
  '20260528120000',
  '20260528120100',
  '20260528130000',
  '20260528140000',
  '20260529120000',
  '20260529130000',
  '20260530120000',
  '20260531000000',
  '20260531120000',
  '20260601120000',
  '20260601120100',
  '20260601120200',
  '20260601130000',
  '20260602120000',
  '20260603120000',
  '20260604120000',
  '20260605120000',
  '20260605120100',
  '20260605120200',
  '20260605120300',
  '20260605120400'
)
and s.version !~ '^[0-9]{14}_';

-- Polluted long-form versions (legacy: version = '20260528120000_initial_schema')
-- Add a stub file with that exact prefix OR delete on dev-only:
-- delete from supabase_migrations.schema_migrations where version ~ '^[0-9]{14}_';

-- STEP 3 — After git has a file for every version in STEP 1, push again.
-- Only migrations not yet in schema_migrations will apply (e.g. 2026060512*).
