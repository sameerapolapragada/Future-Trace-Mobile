-- =============================================================================
-- Fix: "Remote migration versions not found in local migrations directory"
-- Run on your Supabase branch (SQL Editor).
-- Regenerate local version list: ls supabase/migrations/*.sql | sed 's/.*\///;s/_.*//'
-- =============================================================================

-- STEP 1 — See what Supabase thinks is applied
select version, name, inserted_at
from supabase_migrations.schema_migrations
order by version;

-- STEP 2 — Orphan rows (version in DB but no matching file in git)
-- Every version below must have a file: supabase/migrations/<version>_*.sql
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
  '20260605120400',
  '20260608120000',
  '20260608130000',
  '20260608150000',
  '20260608160000',
  '20260608170000',
  '20260608170100',
  '20260608180000',
  '20260609140000',
  '20260609150000',
  '20260610120000',
  '20260610200000',
  '20260610300000',
  '20260610400000',
  '20260610500000',
  '20260610600000',
  '20260610700000',
  '20260610710000',
  '20260610800000',
  '20260610900000',
  '20260611000000',
  '20260611000001',
  '20260611120000'
)
and s.version !~ '^[0-9]{14}_';

-- STEP 3 — Polluted long-form versions (legacy: version = '20260528120000_initial_schema')
select version, name
from supabase_migrations.schema_migrations
where version ~ '^[0-9]{14}_'
   or length(version) > 14;

-- Fix polluted rows on dev/preview only (after confirming STEP 3):
-- delete from supabase_migrations.schema_migrations where version ~ '^[0-9]{14}_';

-- STEP 4 — After git has a file for every version in STEP 1, push again.
-- CLI: supabase migration list  (every remote row should have a local match)
-- CLI: supabase db push
