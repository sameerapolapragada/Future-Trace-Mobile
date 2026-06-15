# Supabase Production Setup

**Audience:** Sammy  
**Last updated:** June 2026  
**Related:** [GO_LIVE_CHECKLIST.md](../../docs/GO_LIVE_CHECKLIST.md), [verify_production.sql](../scripts/verify_production.sql)

---

## Current state (linked dev project)

| Item | Project `fepqvdleqodzygquihbj` ("Future Trace") |
|------|--------------------------------------------------|
| All migrations through `20260610600000` | Applied |
| pg_cron | Enabled |
| Daily cleanup jobs (3) | Active |
| `handle_new_user_signup` trigger | Present; profiles/entitlements match user count |
| RLS on user tables | Enabled + forced |
| `monthly-career-plan-refresh` cron | Pending — apply `20260610700000` |
| Internal RPC hardening | Pending — apply `20260610710000` |

> **Note:** `config.toml` had `project_id = sqooryqoncsjrwffosui` but CLI is linked to `fepqvdleqodzygquihbj`. Use `supabase link` to switch projects; do not mix dev and prod credentials.

---

## Step 1 — Create production project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `Future Trace Production` (or similar)
3. Region: same as dev (lower latency for cron + auth)
4. **Save** the new project ref, URL, anon key, and service role key in your secrets manager — not in git.

```bash
cd "/Users/sammy/future trace mobile"
supabase link --project-ref YOUR_PROD_PROJECT_REF
supabase db push
```

Re-link to dev when done:

```bash
supabase link --project-ref fepqvdleqodzygquihbj
```

---

## Step 2 — Enable pg_cron

Dashboard → **Database** → **Extensions** → enable **pg_cron**.

Then push migrations (cron jobs register in `20260605120400` and `20260610700000`):

```bash
supabase db push
```

Verify:

```bash
supabase db query --linked "SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;"
```

Expected **4 jobs**:

| Job | Schedule (UTC) | Function |
|-----|----------------|----------|
| `data-minimization-cleanup` | `0 0 * * *` | `cleanup_old_free_scans()` |
| `integration-staging-cleanup` | `30 0 * * *` | `cleanup_integration_staging_raw()` |
| `llm-jobs-redaction-cleanup` | `0 1 * * *` | `cleanup_old_llm_jobs()` |
| `monthly-career-plan-refresh` | `0 3 1 * *` | `monthly_career_plan_refresh()` |

---

## Step 3 — RLS spot-check

Run the full script:

```bash
supabase db query --linked -f supabase/scripts/verify_production.sql
```

Manual cross-user test (two test accounts):

1. Sign in as User A → note a `career_scans.id`
2. Sign in as User B → attempt `select * from career_scans where id = '<A-scan-id>'` via SQL Editor with User B JWT, or via client — expect **0 rows**
3. Repeat for `career_goals`, `career_xrays`, `weekly_milestones`

Security advisors:

```bash
supabase db advisors --linked --type security --level warn
```

Migration `20260610710000` revokes `anon`/`authenticated` execute on `_`-prefixed internal RPCs.

---

## Step 4 — Auth redirect URLs

Dashboard → **Authentication** → **URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://app.futuretrace.com` (replace with real domain) |
| Redirect URLs | Add each line below |

```
http://localhost:5173/login
http://localhost:5173/**
https://app.futuretrace.com/login
https://app.futuretrace.com/**
```

The web app uses `window.location.origin + '/login'` for signup confirmation and OAuth (`AuthProvider.tsx`). No separate `/auth/callback` route — Supabase redirects back to `/login` with hash params.

---

## Step 5 — Email confirmation policy

**Recommendation: enable confirmations in production.**

| | Dev (local `config.toml`) | Production (Dashboard) |
|--|---------------------------|------------------------|
| Confirm email | `false` (faster iteration) | `true` |
| Rationale | Skip inbox friction while building | Reduces fake signups; app already handles it |

The client already supports both modes:

- `isEmailConfirmed()` gates `isAuthenticated`
- `LoginPage` shows resend + "email not confirmed" errors
- `signUp` sets `emailRedirectTo: ${origin}/login`

Dashboard → **Authentication** → **Providers** → **Email** → enable **Confirm email**.

---

## Step 6 — Branded auth email templates

Templates live in `supabase/templates/`. Copy into Dashboard → **Authentication** → **Email Templates**, or reference via `config.toml` for local Supabase.

| Template | File | Subject |
|----------|------|---------|
| Confirm signup | `confirmation.html` | Confirm your Future Trace account |
| Magic link | `magic_link.html` | Your Future Trace sign-in link |
| Reset password | `recovery.html` | Reset your Future Trace password |
| Email change | `email_change.html` | Confirm your new email |

Use `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}` per [Supabase template vars](https://supabase.com/docs/guides/auth/auth-email-templates).

---

## Step 7 — Verify signup trigger

After creating a test user in production:

```sql
select u.id, u.email,
  p.id as profile_id,
  ue.user_id as entitlement_id,
  (select count(*) from compliance_logs cl
   where cl.target_profile_id = u.id and cl.action_performed = 'ACCOUNT_CREATED') as created_log
from auth.users u
left join public.profiles p on p.id = u.id
left join public.user_entitlements ue on ue.user_id = u.id
where u.email = 'your-test@example.com';
```

All joins should match; `created_log` should be `1`.

---

## Step 8 — Seed production products

After Stripe live products exist:

```sql
update public.products
set stripe_price_id = 'price_LIVE_XRAY_ID'
where id = 'career_xray';

update public.products
set stripe_price_id = 'price_LIVE_RADAR_ID'
where id = 'ai_career_radar_monthly';
```

---

## Quick commands

```bash
# Push pending migrations to linked project
supabase db push

# List migration sync
supabase migration list

# Full verification
supabase db query --linked -f supabase/scripts/verify_production.sql

# Security lint
supabase db advisors --linked --type security
```
