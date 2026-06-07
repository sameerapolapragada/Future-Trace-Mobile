# GDPR / CCPA — Career Intelligence Database

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Account profile; cascades from `auth.users` deletion |
| `career_scans` + `scan_inputs` | Career form PII + LLM results |
| `xray_reports`, `radar_snapshots` | Paid/subscription intelligence artifacts |
| `compliance_logs` | Immutable audit trail (`target_profile_id` survives erasure) |
| `user_entitlements` | Free scan quota, X-Ray unlock, Radar subscription state |

## Right to be forgotten

Deleting a user in **Authentication → Users** (or `auth.admin.deleteUser`) removes `auth.users` → cascades to `profiles`, `career_scans`, `xray_reports`, `radar_snapshots`, etc.

`compliance_logs` rows remain with `target_profile_id` for legal audit.

Log deletion requests from the app:

```sql
select public.log_compliance_event('ACCOUNT_DELETION_REQUESTED');
select public.log_compliance_event('DATA_EXPORT');
```

## Data minimization

| Function | Retention |
|----------|-----------|
| `cleanup_old_career_scans()` | Free-tier scans > **30 days** (no X-Ray, no Radar) |
| `cleanup_integration_staging_raw()` | Staging payloads > **30 days** |
| `cleanup_old_llm_jobs()` | Redacts `raw_response` after **90 days** |

Scheduled via pg_cron (migrations `20260601120000`, `20260605120200`):

- `data-minimization-cleanup` — `0 0 * * *` UTC
- `integration-staging-cleanup` — `30 0 * * *` UTC
- `llm-jobs-redaction-cleanup` — `0 1 * * *` UTC

**Note:** Migrations do not run `CREATE EXTENSION pg_cron` (Supabase pre-installs it; doing so causes `SQLSTATE 2BP01`). Enable pg_cron in Dashboard if jobs are skipped.

## RLS summary

- **profiles, user_career_profiles, user_skills:** own row SELECT/INSERT/UPDATE
- **career_scans, scan_inputs:** own row SELECT/INSERT only (immutable)
- **xray_reports, radar_snapshots:** own row SELECT only (writes via service role)
- **user_entitlements, purchases, user_subscriptions:** own row SELECT only
- **compliance_logs:** INSERT only for authenticated users
- **Reference catalog** (roles, skills, benchmarks): public read
- **salary_observations, llm_jobs, staging:** service role only (RLS enabled, no client policies)

## Signup

Web/mobile sign-up should send display name metadata:

```ts
options: { data: { full_name: 'Jane Doe' } }
```

Trigger `handle_new_user_signup()` creates `profiles`, `user_entitlements`, and logs `ACCOUNT_CREATED`.
