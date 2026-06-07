# Supabase — Career Intelligence Schema

Postgres migrations for the Future Trace mobile product (Career Scan, X-Ray, Radar).

**Design reference:** [docs/DATABASE_DESIGN.md](../docs/DATABASE_DESIGN.md)  
**Compliance reference:** [docs/COMPLIANCE.md](./docs/COMPLIANCE.md)

## Apply migrations

```bash
cd "/Users/sammy/future trace mobile"
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste each file in `migrations/` into the Supabase SQL Editor in timestamp order.

## Migration files

| File | Purpose |
|------|---------|
| `20260605120000_career_intelligence_schema.sql` | Tables, enums, indexes, FKs |
| `20260605120100_career_intelligence_compliance_rls.sql` | RLS, signup trigger, audit RPC, retention functions |
| `20260605120200_career_intelligence_retention_cron.sql` | pg_cron nightly cleanup jobs |
| `20260605120300_career_intelligence_seed.sql` | Products, geo markets, sample roles/skills |

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
