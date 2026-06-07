# Supabase — Career Intelligence Schema

Postgres migrations for the Future Trace mobile product (Career Scan, X-Ray, Radar).

**Design reference:** [docs/DATABASE_DESIGN.md](../docs/DATABASE_DESIGN.md)  
**Compliance reference:** [docs/COMPLIANCE.md](./docs/COMPLIANCE.md)  
**Migration sync issues:** [docs/MIGRATION_SYNC.md](./docs/MIGRATION_SYNC.md)

## Why the full migration chain?

This repo shares the same Supabase project as `Future-Trace`. Remote `supabase_migrations.schema_migrations` includes migrations from `20260528120000` onward. **Every applied remote version must have a matching file** in `supabase/migrations/` or Git/CLI reports:

> Remote migration versions not found in local migrations directory.

Local migrations are the **complete chain**: Future-Trace history (16 files) + career intelligence (4 files).

## Apply migrations

```bash
cd "/Users/sammy/future trace mobile"
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste each file in `migrations/` into the Supabase SQL Editor in timestamp order.

## Migration files

| Range | Purpose |
|-------|---------|
| `20260528*` – `20260604*` | Shared Future-Trace base (auth, profiles, GDPR, matcher, cron) |
| `20260605120000` | Career intelligence tables, enums, indexes |
| `20260605120100` | RLS, signup trigger, compliance RPC |
| `20260605120400` | pg_cron retention jobs |
| `20260605120300` | Seed products, roles, geo markets |

## Troubleshooting sync errors

1. SQL Editor → run [docs/repair_schema_migrations.sql](./docs/repair_schema_migrations.sql) STEP 1.
2. Compare output to `ls supabase/migrations/`.
3. Any orphan version needs a matching `.sql` file in git (copy from `Future-Trace` or add a no-op stub).
4. Push again; only **new** versions (typically `2026060512*`) will apply.

## Merging with `Future-Trace`

These migrations are idempotent where possible (`IF NOT EXISTS`, `ON CONFLICT`). When applying to the shared Future-Trace Supabase project:

- Reuses / extends `profiles`, `compliance_logs`, `milestones` if already present
- Adds mobile-specific tables: `career_scans`, `xray_reports`, `radar_snapshots`, market fact tables
- `cleanup_old_free_scans()` handles both legacy `ai_scan_history` and new `career_scans`

## Verify after apply

```sql
-- Tables
select tablename from pg_tables
where schemaname = 'public'
  and tablename in ('career_scans', 'user_entitlements', 'role_salary_benchmarks')
order by tablename;

-- Cron jobs
select jobname, schedule, active from cron.job
where jobname like '%cleanup%';
```
