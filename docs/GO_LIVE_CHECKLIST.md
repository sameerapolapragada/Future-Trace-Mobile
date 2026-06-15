# Future Trace — Go Live Checklist

**Status:** Pre-launch  
**Audience:** Sammy  
**Last updated:** June 2026  
**Scope:** Mobile web PWA public launch  
**Related:** [RELEASE_PENDING_TASKS.md](./RELEASE_PENDING_TASKS.md), [TESTING_USE_CASES.md](./TESTING_USE_CASES.md)

---

## How to use this checklist

- Check items in order within each phase.
- **Blockers** must be green before public traffic.
- Run [TESTING_USE_CASES.md](./TESTING_USE_CASES.md) smoke suite after Phase 4.

---

## Phase 1 — Product & legal readiness

| # | Item | Owner | Done |
|---|------|-------|------|
| 1.1 | Privacy policy URL live | Product | ☐ |
| 1.2 | Terms of service URL live | Product | ☐ |
| 1.3 | AI-generated content disclaimer on scan/X-Ray results | Product | ☐ |
| 1.4 | Stripe pricing matches UI ($1.99 X-Ray, $9.99/mo transition) | Product | ☐ |
| 1.5 | Support contact email in Profile / help section | Product | ☐ |
| 1.6 | GDPR/CCPA: account delete path defined (even if manual v1) | Legal | ☐ |

---

## Phase 2 — Supabase production

| # | Item | Command / location | Done |
|---|------|-------------------|------|
| 2.1 | Production Supabase project created (separate from dev) | Dashboard | ☐ |
| 2.2 | All migrations applied | `supabase db push` | ☐ |
| 2.3 | RLS enabled on user tables — spot check | SQL / Dashboard | ☐ |
| 2.4 | pg_cron extension enabled | Dashboard → Database | ☐ |
| 2.5 | Cron: `data-minimization-cleanup` (daily) | Verify `cron.job` | ☐ |
| 2.6 | Cron: `integration-staging-cleanup` (daily) | Verify | ☐ |
| 2.7 | Cron: `llm-jobs-redaction-cleanup` (daily) | Verify | ☐ |
| 2.8 | Cron: `monthly_career_plan_refresh` scheduled | Service-role / Vercel | ☐ |
| 2.9 | `products` table has live Stripe price IDs | SQL | ☐ |
| 2.10 | Auth email templates branded | Supabase Auth settings | ☐ |
| 2.11 | Auth redirect URLs include production domain | Supabase Auth | ☐ |
| 2.12 | `handle_new_user_signup` trigger verified on signup | Test signup | ☐ |

---

## Phase 3 — BFF (Future-Trace) production

| # | Item | Done |
|---|------|------|
| 3.1 | BFF deployed to production (Vercel or equivalent) | ☐ |
| 3.2 | `GEMINI_API_KEY` set in production env | ☐ |
| 3.3 | `STRIPE_SECRET_KEY` (live) set | ☐ |
| 3.4 | `STRIPE_WEBHOOK_SECRET` set | ☐ |
| 3.5 | `SUPABASE_SERVICE_ROLE_KEY` set (server only) | ☐ |
| 3.6 | `POST /api/v1/scans` — real Gemini generation | ☐ |
| 3.7 | `POST /api/v1/xray/generate` — real Gemini generation | ☐ |
| 3.8 | `POST /api/v1/checkout` + `confirm` — production Stripe | ☐ |
| 3.9 | Stripe webhooks pointing to production BFF URL | ☐ |
| 3.10 | Webhook events tested: checkout complete, subscription created/updated/deleted | ☐ |
| 3.11 | Rate limiting on scan endpoint | ☐ |
| 3.12 | `llm_jobs` logging enabled | ☐ |
| 3.13 | Error monitoring (Sentry) on BFF | ☐ |
| 3.14 | CORS allows production web origin only | ☐ |

---

## Phase 4 — Web PWA production

| # | Item | Done |
|---|------|------|
| 4.1 | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (prod) in build | ☐ |
| 4.2 | `VITE_API_BASE_URL` → production BFF | ☐ |
| 4.3 | Production build succeeds | `npm run build` | ☐ |
| 4.4 | `dist/sw.js` + `dist/manifest.webmanifest` deployed | ☐ |
| 4.5 | HTTPS enforced on app domain | ☐ |
| 4.6 | Custom domain configured (e.g. `app.futuretrace.com`) | ☐ |
| 4.7 | Mock scan path disabled — real BFF only | ☐ |
| 4.8 | Mock X-Ray fallback acceptable only as error state (not default) | ☐ |
| 4.9 | `checkoutDevPlugin` not used in production build | ☐ |
| 4.10 | Sentry (or equivalent) on client | ☐ |
| 4.11 | Smoke test on iOS Safari + Android Chrome | ☐ |
| 4.12 | PWA install tested on real device | ☐ |

---

## Phase 5 — Security review

| # | Item | Done |
|---|------|------|
| 5.1 | No secrets in `VITE_*` except Supabase anon key | ☐ |
| 5.2 | `SUPABASE_SERVICE_ROLE_KEY` not in web repo or client bundle | ☐ |
| 5.3 | `GEMINI_API_KEY` not in web repo or client bundle | ☐ |
| 5.4 | RLS: user A cannot read user B data (manual test) | ☐ |
| 5.5 | Stripe webhook signature verification enabled | ☐ |
| 5.6 | Service worker does not cache authenticated API responses | ☐ |
| 5.7 | Email never sent to Gemini prompts (BFF audit) | ☐ |
| 5.8 | `.env.local` in `.gitignore` — no secrets committed | ☐ |

---

## Phase 6 — Observability & ops

| # | Item | Done |
|---|------|------|
| 6.1 | Uptime monitoring on app URL | ☐ |
| 6.2 | Uptime monitoring on BFF `/api/health` (add if missing) | ☐ |
| 6.3 | Supabase disk/connection alerts | ☐ |
| 6.4 | Stripe dashboard alerts for failed payments | ☐ |
| 6.5 | LLM cost dashboard from `llm_jobs` | ☐ |
| 6.6 | Runbook: how to manually fix entitlements | ☐ |
| 6.7 | Runbook: how to refund via Stripe + sync DB | ☐ |

---

## Phase 7 — Launch day

| # | Item | Done |
|---|------|------|
| 7.1 | Switch Stripe to live mode | ☐ |
| 7.2 | Final smoke test on production URLs | ☐ |
| 7.3 | Analytics baseline (signup, scan complete, purchase) | ☐ |
| 7.4 | Announce / share link tested on mobile | ☐ |
| 7.5 | Monitor error rates first 24 hours | ☐ |
| 7.6 | Support inbox monitored | ☐ |

---

## Phase 8 — Post-launch (first week)

| # | Item | Done |
|---|------|------|
| 8.1 | Review `llm_jobs` failure rate | ☐ |
| 8.2 | Review conversion: signup → scan → pay | ☐ |
| 8.3 | Review cron job runs in Supabase logs | ☐ |
| 8.4 | Collect mobile PWA install feedback | ☐ |
| 8.5 | Triage obsolete DB tables (see [OBSOLETE_DB_TABLES.md](./OBSOLETE_DB_TABLES.md)) | ☐ |

---

## Quick reference — production URLs

| Service | URL (fill in) |
|---------|---------------|
| PWA | `https://app._______________` |
| BFF | `https://api._______________` |
| Supabase | `https://_______________supabase.co` |
| Stripe webhooks | `https://api._______________/api/webhooks/stripe` |

---

## Blockers summary (must be ☑ before launch)

1. Real scan + X-Ray via BFF/Gemini (not mock-default)
2. Production Stripe webhooks → entitlements
3. All Supabase migrations + crons on prod
4. HTTPS PWA deploy with correct env vars
5. Mobile smoke test pass (iOS + Android)
6. Privacy policy + AI disclaimer live

See [RELEASE_PENDING_TASKS.md](./RELEASE_PENDING_TASKS.md) for implementation detail.
