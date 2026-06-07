# Future Trace V1 — Pending Implementation Checklist

**Status:** Pending implementation  
**Audience:** Sammy  
**Last updated:** June 2026  
**Scope:** Mobile web (`web/`), BFF in `Future-Trace` (Next.js), Supabase Postgres  
**Related:** [MOBILE_VS_WEB.md](./MOBILE_VS_WEB.md), [BACKEND_AND_LLM_STRATEGY.md](./BACKEND_AND_LLM_STRATEGY.md), [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)

---

## Overview

The V1 web UI is complete. Auth (Supabase client) is partially wired. Database migrations exist under `supabase/migrations/`. Everything else — scan generation, entitlements, billing, and real data — is still mock or client-only.

**Assumption:** BFF lives in `Future-Trace` (Next.js API routes). Vite `web/` stays the client. Gemini key goes in server env only (`GEMINI_API_KEY`).

### Decide once before Week 1

- [ ] Confirm shared Supabase project ref (same as `Future-Trace`)
- [ ] Free scan limit: **1 lifetime** (recommended in docs) vs 1/month
- [ ] Auth: email/password only for now, or add Google/Apple

---

## Week 1 — Foundation (no LLM yet)

**Goal:** Real auth + entitlements + profile; app still shows mocks for scan content.

### 1.1 Supabase project setup

| Task | Where | Done when |
|------|--------|-----------|
| Copy env template | `web/.env.example` → `web/.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set |
| Link & push migrations | `supabase/README.md` | `career_scans`, `user_entitlements`, `products` exist (verify SQL in README) |
| Set Stripe price IDs on products | `products` table (`stripe_price_id`) | `xray` = $1.99, `radar` = $9.99/mo price IDs from Stripe dashboard |

**Verify:**

```sql
select id, stripe_price_id from public.products;
select * from public.user_entitlements limit 1;
```

### 1.2 Auth polish (client)

| Task | File(s) | Notes |
|------|---------|-------|
| Commit auth wiring | `web/src/auth/*`, `web/src/lib/supabaseClient.ts`, `web/src/router.tsx`, `web/src/main.tsx` | Already drafted in branch |
| Post-signup flow | `web/src/pages/LoginPage.tsx`, `web/src/pages/SplashPage.tsx` | Handle email confirmation if enabled in Supabase |
| Onboarding → login gate | `web/src/pages/OnboardingPage.tsx` | After slides, route to `/login` if no session |

**DB trigger (already in migrations):** `handle_new_user_signup()` in `20260605120100_career_intelligence_compliance_rls.sql` should create `user_entitlements` row on signup.

### 1.3 Entitlements service (replace `sessionStorage`)

| Task | File(s) | Reads/writes |
|------|---------|--------------|
| Create API client | **new** `web/src/lib/apiClient.ts` | `VITE_API_BASE_URL` → Future-Trace origin |
| Replace entitlements module | `web/src/lib/entitlements.ts` | Query `user_entitlements` via Supabase client **or** `GET /api/v1/me` |
| Update all consumers | `CareerScanPage`, `CareerXRayOfferPage`, `UpgradePage`, `HomePage`, `ProfilePage`, `RadarPage`, `CareerXRayPage`, `RoleIntelligencePage`, `CareerXRayCompleteView` | Remove `unlock()` / `useScan()` local-only calls |

**Target shape** (matches `web/src/types/index.ts` → `Entitlements`):

```ts
{ freeScansRemaining, hasCareerXRay, hasRadar }
```

**DB table:** `public.user_entitlements`  
Columns: `free_scans_remaining`, `has_career_xray`, `has_radar`, `subscription_expires_at`

### 1.4 Profile from real user

| Task | File(s) | Source |
|------|---------|--------|
| Show auth email/name | `web/src/pages/ProfilePage.tsx` | `useAuth().user` instead of `mockData.userProfile` |
| Load scan history list | `web/src/pages/ProfilePage.tsx` | `career_scans` ordered by `created_at desc` |
| Optional: career profile | `user_career_profiles` or latest `scan_inputs` | Job title, industry from last scan |

### 1.5 BFF: `/api/v1/me`

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/v1/me` | GET | User profile + `user_entitlements` + latest scan id |

**Future-Trace location (new):** `app/api/v1/me/route.ts`  
**Auth:** Supabase JWT from `Authorization: Bearer <access_token>`

### Week 1 acceptance criteria

- [ ] Sign up → `user_entitlements` row exists with `free_scans_remaining = 1`
- [ ] Profile shows real email; entitlements survive refresh (not `sessionStorage`)
- [ ] Paywall buttons still mock-unlock **or** disabled until Week 3 Stripe

---

## Week 2 — Free Career Scan pipeline (+ Gemini)

**Goal:** Form → API → LLM → DB → results page with real data.

### 2.1 Scan form → API

| Task | File(s) | Change |
|------|---------|--------|
| Collect & POST form payload | `web/src/pages/CareerScanPage.tsx` | On submit: `POST /api/v1/scans` with form fields; pass returned `scanId` to loading page |
| Poll scan status | `web/src/pages/ScanLoadingPage.tsx` | Replace fixed 5.5s timer with `GET /api/v1/scans/:id` every 1–2s until `status === 'complete'` |
| Render real results | `web/src/pages/ScanResultsPage.tsx` | Fetch scan by id from route state / URL param; map DB `result` jsonb → `CareerScan` type |
| Home dashboard | `web/src/pages/HomePage.tsx` | `GET /api/v1/me` or latest scan instead of `mockData.homeDashboard` |

**Form fields → `scan_inputs` columns:**

| Form field (`CareerScanPage`) | DB column |
|-------------------------------|-----------|
| `jobTitle` | `job_title_raw` |
| `industry` | `industry_raw` |
| `yearsExperience` | `years_experience` |
| `currentSkills` | `current_skills_text` |
| `toolsUsed` | `tools_used_text` |
| `careerGoal` | `career_goal_text` |
| `workPreference` | `work_preference` |

### 2.2 BFF: scan endpoints

| Endpoint | Method | LLM | DB |
|----------|--------|-----|-----|
| `POST /api/v1/scans` | Create job | Yes (async) | `career_scans` (`status: queued`), `scan_inputs`, decrement `free_scans_remaining` |
| `GET /api/v1/scans/:id` | Poll | No | `career_scans.status`, progress fields |
| `GET /api/v1/scans/:id/result` | Full result | No | `career_scans.result` + child tables |

**Future-Trace files (new, pattern from existing matcher):**

- `app/api/v1/scans/route.ts`
- `app/api/v1/scans/[id]/route.ts`
- `lib/scanGemini.ts` (port from `Future-Trace/lib/matcherGemini.ts`)

**Env:** `GEMINI_API_KEY` in Next.js server env (not Vite).

### 2.3 Gemini scan generation

| Task | Detail |
|------|--------|
| Prompt + JSON schema | Output must match `CareerScan` in `web/src/types/index.ts` |
| Store raw JSON | `career_scans.result` jsonb + normalized rows in `scan_strengths`, `scan_vulnerabilities`, `scan_transition_role_suggestions` |
| Idempotency | `unique (user_id, input_hash)` — return existing scan if same input |
| Entitlement check | Block if `free_scans_remaining = 0`; refund on hard LLM failure |
| `llm_jobs` table | Log model (`gemini-1.5-flash`), tokens, status |

### 2.4 Remove scan mocks

| File | Action |
|------|--------|
| `web/src/data/mockData.ts` | Keep `products`, `onboardingSlides` for now; stop importing `careerScans`, `homeDashboard` from pages |
| `ScanLoadingPage.tsx` | Remove hardcoded `scanId: "scan-1"` |

### Week 2 acceptance criteria

- [ ] Submit scan → loading polls → `/canvas` shows **your** form data reflected in results
- [ ] Second identical scan returns cached row (no extra LLM call)
- [ ] `free_scans_remaining` decrements to 0; third scan shows paywall/upgrade message
- [ ] Profile lists real scan history

---

## Week 3 — Career X-Ray ($1.99) + Stripe

**Goal:** Paid unlock + deep report from stored scan.

### 3.1 Stripe checkout (X-Ray)

| Task | File(s) |
|------|---------|
| Checkout button | `web/src/pages/CareerXRayOfferPage.tsx` — replace `unlock("xray")` |
| Success/cancel URLs | Return to `/xray` or `/career-xray?success=1` |
| Webhook handler | `Future-Trace/app/api/webhooks/stripe/route.ts` (extend) |

**Webhook writes:**

- `purchases.status = 'completed'`
- `user_entitlements.has_career_xray = true`
- `user_entitlements.xray_unlocked_at`, `xray_source_scan_id`

**DB:** `products.id = 'xray'`, `purchases`, `user_entitlements`

### 3.2 X-Ray generation

| Endpoint | Method | LLM | Notes |
|----------|--------|-----|-------|
| `POST /api/v1/xray/generate` | Deep pass on latest scan | Yes | Requires `has_career_xray` |
| `GET /api/v1/xray/latest` | Stored report | No | |

**DB:** `xray_reports`, `xray_skill_gaps`, `xray_transition_matches`

### 3.3 Wire X-Ray UI

| Page | File | Data source |
|------|------|-------------|
| X-Ray hub | `web/src/pages/CareerXRayPage.tsx` | `GET /api/v1/xray/latest` |
| Full report | `web/src/pages/CareerXRayCompleteView.tsx` | `XRayCompleteReport` from API, not `mockData.xrayCompleteReport` |
| Opportunities | `web/src/pages/CareerXRayOpportunitiesPage.tsx` | From xray payload |
| Role detail | `web/src/pages/RoleIntelligencePage.tsx` | `GET /api/v1/roles/:slug` (cache in `role_intelligence_cache`) |

**Type target:** `XRayCompleteReport` in `web/src/types/index.ts`

### Week 3 acceptance criteria

- [ ] Stripe test checkout unlocks X-Ray in DB and UI
- [ ] `/xray` shows generated report tied to user's scan
- [ ] Role intelligence page loads per-role data (cached after first hit)
- [ ] Users without X-Ray still gated (existing entitlement checks)

---

## Week 4 — AI Career Radar ($9.99/mo)

**Goal:** Subscription + monthly snapshot dashboard.

### 4.1 Stripe subscription (Radar)

| Task | File(s) |
|------|---------|
| Subscribe flow | `web/src/pages/UpgradePage.tsx` — replace `unlock("radar")` |
| Radar includes X-Ray | Webhook sets both `has_radar` and `has_career_xray` |
| Subscription lifecycle | `user_subscriptions`, `subscription_expires_at` on entitlements |

### 4.2 Radar data

| Endpoint | Method | Notes |
|----------|--------|-------|
| `GET /api/v1/radar/latest` | Latest snapshot | Maps to `RadarDashboard` + `RadarInsights` types |
| `POST /api/cron/radar-refresh` | Batch monthly | Vercel cron; uses `radar_snapshots`, `radar_signals` |

**Cron already scaffolded:** `supabase/migrations/20260605120400_pg_cron_schedule_jobs.sql` — wire app cron to call LLM refresh for active subscribers.

### 4.3 Wire Radar UI

| File | Replace |
|------|---------|
| `web/src/pages/RadarPage.tsx` | `mockData.radarDashboard`, `getCareerXRaySnapshot`, `userProfile` |
| `web/src/pages/CareerXRayCompleteView.tsx` | Radar CTA already routes to `/upgrade` or `/radar` based on entitlements |

### Week 4 acceptance criteria

- [ ] Test subscription activates Radar + X-Ray
- [ ] `/radar` shows stored snapshot (not mock)
- [ ] Expired subscription (`subscription_expires_at` past) gates Radar page
- [ ] Manual/cron refresh creates new `radar_snapshots` row

---

## Week 5+ — Hardening & launch prep

### 5.1 Security & abuse

| Item | Where |
|------|-------|
| RLS policies | `20260605120100_career_intelligence_compliance_rls.sql` — verify all user tables |
| Rate limits | BFF middleware on `POST /api/v1/scans` (e.g. 3/day/IP + per user) |
| Service role isolation | Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vite |
| Stripe webhook signatures | Existing Future-Trace pattern |

### 5.2 Compliance

| Item | Reference |
|------|-----------|
| Account delete | Port `Future-Trace` delete-account route |
| Data export | GDPR RPC in `supabase/docs/COMPLIANCE.md` |
| AI disclaimer | Scan results + paywall copy |
| PII in prompts | Redact email; only career fields to Gemini |

### 5.3 Ops

| Item | Notes |
|------|-------|
| `SENTRY_DSN` | Client + server |
| Cost dashboard | `llm_jobs` table aggregates |
| Deploy Vite | Static host or subdomain (`app.futuretrace.com`) |
| Deploy API | Vercel (`Future-Trace`) |

### 5.4 Optional (post-MVP)

| Item | Notes |
|------|-------|
| Market data ETL | BLS/O*NET → `market_snapshots` (weekly batch) |
| OAuth providers | Supabase dashboard + `LoginPage` |
| Expo full app | Beyond `components/SplashScreen.tsx` |
| Transformation Path | Explicitly "Coming Soon" in `CareerXRayCompleteView.tsx` — out of V1 |

---

## File change map

```
web/  (client)
├── .env.local                          # Supabase keys
├── src/lib/apiClient.ts                # NEW — fetch wrapper + auth header
├── src/lib/entitlements.ts             # REWRITE — DB/API not sessionStorage
├── src/pages/CareerScanPage.tsx        # POST scan
├── src/pages/ScanLoadingPage.tsx       # Poll scan id
├── src/pages/ScanResultsPage.tsx       # Real scan result
├── src/pages/HomePage.tsx              # Latest scan summary
├── src/pages/ProfilePage.tsx           # Auth user + scan list
├── src/pages/CareerXRayOfferPage.tsx   # Stripe checkout
├── src/pages/UpgradePage.tsx           # Stripe subscription
├── src/pages/CareerXRayPage.tsx        # X-Ray from API
├── src/pages/CareerXRayCompleteView.tsx
├── src/pages/RadarPage.tsx
├── src/pages/RoleIntelligencePage.tsx
└── src/data/mockData.ts                # SHRINK — products/onboarding only

Future-Trace/  (BFF — separate repo)
├── app/api/v1/me/route.ts
├── app/api/v1/scans/route.ts
├── app/api/v1/scans/[id]/route.ts
├── app/api/v1/xray/generate/route.ts
├── app/api/v1/xray/latest/route.ts
├── app/api/v1/radar/latest/route.ts
├── app/api/v1/roles/[slug]/route.ts
├── app/api/cron/radar-refresh/route.ts
├── app/api/webhooks/stripe/route.ts    # extend
└── lib/scanGemini.ts                   # GEMINI_API_KEY here

supabase/
└── migrations/                         # already written — push to project
```

---

## Screen → endpoint map

| UI route | Method | Endpoint | LLM? |
|----------|--------|----------|------|
| Login | — | Supabase Auth | No |
| `/scan` submit | POST | `/api/v1/scans` | Yes (Flash) |
| `/scan-loading` | GET | `/api/v1/scans/:id` | No (poll) |
| `/canvas` results | GET | `/api/v1/scans/:id/result` | No |
| `/career-xray` purchase | POST | Stripe checkout | No |
| `/xray` complete | GET | `/api/v1/xray/latest` | No (stored) |
| X-Ray generation | POST | `/api/v1/xray/generate` | Yes (deep) |
| `/xray/role/:slug` | GET | `/api/v1/roles/:slug` | Cached / optional LLM |
| `/upgrade` Radar | POST | Stripe subscription | No |
| `/radar` | GET | `/api/v1/radar/latest` | No (stored) |
| Radar cron | POST | `/api/cron/radar-refresh` | Yes (batch) |
| `/profile` | GET | `/api/v1/me` | No |

---

## Suggested PR sequence

1. **PR 1:** Auth + env + commit current auth branch
2. **PR 2:** `user_entitlements` client hook + Profile real user (no LLM)
3. **PR 3:** `POST/GET scans` + Gemini + wire Scan → Loading → Canvas
4. **PR 4:** Stripe X-Ray + `xray/generate` + X-Ray pages
5. **PR 5:** Stripe Radar + `radar/latest` + cron

---

## What's already done vs still mock

| Area | Status |
|------|--------|
| V1 web UI (all routes, design system) | Done |
| Supabase Auth client (login/signup/signout, protected routes) | In progress (uncommitted) |
| Database migrations | Written, needs `supabase db push` |
| Entitlements | Mock (`sessionStorage` in `web/src/lib/entitlements.ts`) |
| Scan / X-Ray / Radar data | Mock (`web/src/data/mockData.ts`) |
| Stripe billing | Not wired |
| Gemini / API layer | Not wired (server-side in `Future-Trace`) |
| Expo native app | Splash only |

---

*Next recommended step: Week 1 PR 2 — entitlements from Supabase instead of `sessionStorage` (unblocks everything else without Gemini).*
