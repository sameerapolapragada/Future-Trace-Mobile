# Migration sync troubleshooting (Git → Supabase)

**Repo:** Future-Trace-Mobile (`future trace mobile/`)

## Symptom

- **GitHub check:** `Supabase Preview` → `Remote migration versions not found in local migrations directory.`
- **Dashboard:** No new migrations / tables from `Web-Dev` pushes.

**Meaning:** The database has at least one row in `supabase_migrations.schema_migrations` with **no matching file** in `supabase/migrations/` on the `Web-Dev` git branch.

## Cause

Supabase compares **remote** `supabase_migrations.schema_migrations` to **files** in `supabase/migrations/`.  
Every version already applied on the branch database must have a matching file in git.  
If the branch was created from another line of work (e.g. `Dev`) or SQL was run in the dashboard, remote history can be **ahead of** what `Web-Dev` has in git.

## Fix A — Align git with remote (recommended)

1. Open the **Web-Dev** Supabase branch project (GitHub check → “Details” link).
2. **SQL Editor** → run:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

3. For each `version` **missing** from `supabase/migrations/` in this repo, either:
   - **Copy** the real `.sql` from `Dev` / history into `supabase/migrations/<version>_*.sql`, or
   - Add a **no-op stub** (only if that migration is already applied and you have no file):

```sql
-- migration already applied on remote; stub keeps Git in sync
select 1;
```

4. Commit, push `Web-Dev`, re-check **Supabase Preview**.

Current files in git (full chain):

- `20260528120000_initial_schema.sql`
- `20260528120100_seed_plans.sql`
- `20260528130000_add_plans_description.sql`
- `20260528140000_pipeline_test_marker.sql`
- `20260529120000_profiles_ai_scan_history.sql` (sync stub if applied from Dev)
- `20260529130000_ai_scan_history_usage.sql` (sync stub if applied from Dev)
- `20260530120000_gdpr_ccpa_compliance_data_layer.sql`
- `20260531000000_add_is_premium_to_profiles.sql` (remote `schema_migrations.version` updated from `20260531`)
- `20260531120000_web_dev_git_supabase_sync_test.sql`
- `20260601120000_schedule_data_minimization_cron.sql`
- `20260601120100_ai_scan_history_job_title.sql`
- `20260601120200_ai_scan_history_career_roadmap.sql`
- `20260601130000_roadmap_task_completions.sql`
- `20260603120000_matcher_tiers_and_scans.sql`
- `20260604120000_profiles_subscription_expires_at.sql`
- `20260605120000_career_intelligence_schema.sql`
- `20260605120100_career_intelligence_compliance_rls.sql`
- `20260605120200_career_intelligence_retention_cron.sql`
- `20260605120300_career_intelligence_seed.sql`
- `20260605120400_pg_cron_schedule_jobs.sql`

## pg_cron error SQLSTATE 2BP01

**Symptom:** `dependent privileges exist` on `create extension pg_cron`.

**Cause:** Supabase pre-installs pg_cron. Migrations must **not** run `CREATE EXTENSION pg_cron WITH SCHEMA extensions`.

**Fix:**

1. Pull latest `Dev` (commit `1aefd96`+ removes `CREATE EXTENSION` from cron migrations).
2. Re-deploy; migration `20260605120400` registers jobs safely if earlier cron migrations were skipped.
3. Or paste `supabase/scripts/schedule_retention_cron.sql` into SQL Editor.
4. If `20260601120000` is stuck as failed/applied, on dev only:
   ```sql
   delete from supabase_migrations.schema_migrations where version = '20260601120000';
   ```

### Quick repair (run in SQL Editor)

Use **`supabase/docs/repair_schema_migrations.sql`** — STEP 1 lists remote versions; STEP 2 shows orphans.

For each orphan `version` from STEP 2, either:

```bash
chmod +x supabase/scripts/generate_migration_stub.sh
./supabase/scripts/generate_migration_stub.sh PASTE_14_DIGIT_VERSION name_here
git add supabase/migrations && git commit -m "Add migration stub for remote sync" && git push origin Web-Dev
```

Or ( **dev branch only** ) delete the orphan row:

```sql
delete from supabase_migrations.schema_migrations where version = 'PASTE_VERSION_HERE';
```

### Polluted rows (common on branched projects)

Some runs store `version = '20260528120000_initial_schema'` instead of `version = '20260528120000'`.
Git expects a file named like the `version` column. If STEP 2 shows long `version` strings, add stubs with that **exact** prefix, or delete polluted rows:

```sql
delete from supabase_migrations.schema_migrations where version ~ '^[0-9]{14}_';
```

(Only on a **dev/preview** branch, after confirming STEP 1.)

## Fix B — Fresh branch (empty history)

Create a new **persistent** Supabase branch for `Web-Dev` only, link it in **Branches → Git**, and push.  
Only the five migrations above run (no drift from `Dev`).

## Fix C — Manual apply (bypass Git check)

Paste `migrations/20260530120000_gdpr_ccpa_compliance_data_layer.sql` into **SQL Editor** on the target branch.  
Git integration still fails until Fix A is done.

## Required repo files

- `supabase/config.toml` — must exist (branch `project_id`).
- `supabase/migrations/*.sql` — complete history matching remote.

## One-way rule

Schema changes only via new files in `supabase/migrations/` → commit → push.  
Do not rely on dashboard DDL without a matching migration file.
