# Future Trace V1 — Backend, Live Data & LLM Strategy

**Status:** Planning document (no implementation)  
**Audience:** Sammy  
**Last updated:** June 2026  
**Scope:** Mobile web (`web/`), Expo app, and alignment with the existing Next.js repo (`Future-Trace/`)

---

## 1. Where you are now

### Frontend (complete)

| Surface | Location | State |
|---------|----------|--------|
| V1 mobile web | `future trace mobile/web/` | UI complete, mock data, `sessionStorage` entitlements |
| Expo splash | `future trace mobile/` | Splash only |
| Production-style app | `Future-Trace/` (Next.js) | Supabase auth, Stripe, matcher scan API, Gemini LLM, migrations |

### V1 products (web)

| Product | Price | Core output |
|---------|-------|-------------|
| Career Resilience Scan | Free | Resilience index, AI exposure, strengths/vulnerabilities, transition role names |
| Career X-Ray | $1.99 one-time | Full X-Ray complete report, 5 transition roles, skill gap table, role intelligence |
| AI Career Radar | $9.99/mo | Readiness dashboard, market demand, skill gap movement, monthly signals |

### What is still missing

1. Real auth (replace demo login)
2. Persistent user profiles & scan history
3. Server-side entitlements (replace `sessionStorage`)
4. Stripe checkout + webhooks wired to V1 SKUs
5. Scan / X-Ray / Radar **generation pipelines** (today: `mockData.ts`)
6. Optional: live labor-market feeds (BLS, job boards, etc.)
7. Deployment, monitoring, rate limits, caching

---

## 2. Recommended next steps (ordered)

### Phase A — Backend foundation (1–2 weeks)

1. **Pick one backend home base** (recommendation below: extend existing Supabase + Next.js API, not a greenfield Django app).
2. **Define API contract** between `web/` and backend (`POST /api/v1/scan`, `GET /api/v1/xray/:scanId`, etc.).
3. **Port entitlements to Postgres** (`has_career_xray`, `has_radar`, `subscription_expires_at`, free scan quota).
4. **Wire Supabase Auth** to V1 login (email magic link or OAuth — match what `Future-Trace` already uses).
5. **Stripe products** for `$1.99` X-Ray and `$9.99/mo` Radar; webhook updates `profiles`.
6. **Replace mock scan flow**: form → API → job → poll/stream → results page.

### Phase B — Intelligence layer (1–2 weeks)

7. **Implement scan prompt + JSON schema** (reuse patterns from `Future-Trace/lib/matcherGemini.ts`).
8. **Cache results** per `(user_id, scan_input_hash)` to avoid repeat LLM spend.
9. **X-Ray = paid enrichment** on same scan artifact (extra LLM pass OR deeper schema — not a full re-scan).
10. **Radar = scheduled refresh** (monthly cron) + stored snapshots for diff/trends.

### Phase C — Production hardening (ongoing)

11. Rate limits, abuse protection, PII retention policy.
12. Error monitoring (Sentry), structured logs, cost dashboards per feature.
13. Admin tools / support views for refunds and entitlement fixes.

---

## 3. What backend should you use?

### Recommendation: **Supabase + Next.js API routes** (extend `Future-Trace`, don’t restart)

You already have:

- Supabase (`profiles`, RLS, migrations)
- Stripe checkout + webhooks
- A working **Gemini** matcher scan pipeline (`app/api/matcher/scan/route.ts`, `lib/matcherGemini.ts`)
- OpenAI usage elsewhere (`lib/analyzeRoadmap.ts` — different product surface)

**Why this wins for V1**

| Need | Supabase | Next.js API | Notes |
|------|----------|-------------|-------|
| Auth | ✅ | — | JWT, RLS, mobile-friendly |
| Postgres + JSONB scans | ✅ | — | Store full report payloads |
| Stripe webhooks | — | ✅ | Already implemented |
| LLM orchestration | — | ✅ | Server-only API keys |
| Fast iteration | ✅ | ✅ | Same repo you’ve been shipping |

**Do not choose Django for V1** unless your team is already Django-native. You would duplicate auth, billing, migrations, and deployment for little gain at this stage.

**Do not choose “Python only” without a database layer** — you still need Postgres, auth, and billing; that becomes Supabase + FastAPI anyway.

### When to add Python (FastAPI) later

Add a **small Python worker** only when you hit one of these:

- Heavy PDF/resume parsing pipelines
- Batch Radar jobs (thousands of users, long-running)
- Custom ML / embeddings pipeline (role similarity, skill graphs)
- Data science team wants notebooks → production jobs

Pattern: **Next.js enqueues job → Supabase `jobs` table → Python worker processes → writes result row**.

### Architecture diagram (MVP)

```
┌─────────────────┐     ┌─────────────────┐
│  Vite web (V1)  │     │  Expo (future)  │
└────────┬────────┘     └────────┬────────┘
         │  HTTPS / JSON          │
         └──────────┬─────────────┘
                    ▼
         ┌──────────────────────┐
         │  Next.js API (BFF)   │
         │  /api/v1/*           │
         └──────────┬───────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Supabase │  │  Stripe  │  │ LLM API  │
│ Auth+DB  │  │          │  │ Gemini/  │
│ Storage  │  │          │  │ OpenAI   │
└──────────┘  └──────────┘  └──────────┘
```

**BFF** = Backend-for-Frontend: one API tailored to your apps; keeps keys off the client.

---

## 4. Live data: best strategy for MVP

### Principle: **Hybrid — facts from APIs, narrative from LLM**

| Data type | MVP source | Why |
|-----------|------------|-----|
| Salary ranges | LLM + periodic cache | Job APIs are messy/expensive; LLM is good enough with disclaimer |
| Job posting counts | LLM estimate OR one aggregator | True “live” counts need Indeed/LinkedIn partnerships |
| Skill demand trends | LLM + curated seed list | “Prompt engineering +28%” style signals |
| User-specific scores | LLM on user input | Core product value |
| Unemployment / OOH growth | **BLS API** (free) | Optional enrichment, not user-facing raw data |
| SOC / O*NET occupation codes | **O*NET Web Services** | Normalize role titles, skill taxonomies |

### Do **not** ask an LLM to browse the live web on every request

- Slow, expensive, non-deterministic, hard to test.
- Use LLM to **interpret** structured inputs (user profile + cached market snapshot).

### MVP live-data stack (practical)

1. **Weekly batch job** pulls free/public datasets (BLS, O*NET) → `market_snapshots` table.
2. **Scan/X-Ray/Radar prompts** include a small JSON “market context” blob (top 5 skills, 3 role growth labels).
3. **Refresh Radar monthly** per subscriber using latest snapshot + user’s last scan (one LLM call).
4. Label UI honestly: *“AI-generated insights informed by labor market data; not real-time job listings.”*

### Post-MVP live data (when revenue justifies cost)

| Provider | Use case | Rough cost |
|----------|----------|------------|
| Lightcast / Emsi Burning Glass | Role demand, skills | Enterprise $$$ |
| Adzuna / Reed API | Job counts by title | Mid-tier |
| LinkedIn / Indeed | Not available for startups at scale | — |

---

## 5. LLM vs native APIs for MVP?

### Use LLM for (yes)

- Career Resilience Scan interpretation
- Transition role ranking & “why it fits” copy
- Skill gap analysis & recommended actions
- Role intelligence narratives
- Radar “signals” and monthly digest text
- Personalization from free-text career goals

### Use native APIs / database for (yes)

- Authentication, billing, entitlements
- Storing scans & report JSON
- Cron schedules (Radar refresh)
- Rate limiting & audit logs
- Optional: occupation taxonomy (O*NET), macro stats (BLS)

### Use LLM for “live market data” directly? **No for MVP**

Instead: **LLM synthesizes** from a **cached market snapshot** you update weekly. That gives 90% of the UX at 10% of the cost and risk.

---

## 6. Which LLM? (recommendation)

You already use **Google Gemini 1.5 Flash** in `Future-Trace` for matcher scans. **Stay on Gemini Flash for V1** unless quality fails on structured JSON.

### Comparison (MVP structured JSON tasks)

| Model | Strengths | Weaknesses | Typical use here |
|-------|-----------|------------|------------------|
| **Gemini 1.5 Flash** | Cheapest, fast, already integrated | Occasional JSON schema drift | Free scan, X-Ray, Radar |
| **Gemini 1.5 Pro** | Better reasoning | ~10–20× Flash cost | Escalation only |
| **GPT-4o-mini** | Strong JSON, good docs | Slightly pricier than Flash | Alternative if Gemini quality issues |
| **GPT-4o** | Best quality | Too expensive for free tier | Paid escalation only |
| **Claude 3.5 Haiku / Sonnet** | Good prose | Another vendor | Optional A/B |

### Suggested policy

```
Default:     gemini-1.5-flash
Retry JSON:  gemini-1.5-flash (lower temperature, stricter schema)
Escalation:  gemini-1.5-pro OR gpt-4o-mini (only if Flash fails validation twice)
Never:       call Pro/4o for free-tier scans by default
```

---

## 7. LLM pricing reference (approximate — verify before launch)

Prices change; check official pages when you ship. Figures below are **order-of-magnitude** for planning (USD per 1M tokens).

| Model | Input / 1M | Output / 1M |
|-------|------------|-------------|
| Gemini 1.5 Flash | ~$0.075 | ~$0.30 |
| Gemini 1.5 Pro | ~$1.25 | ~$5.00 |
| GPT-4o-mini | ~$0.15 | ~$0.60 |
| GPT-4o | ~$2.50 | ~$10.00 |

### Estimated tokens per feature (single user action)

| Feature | Input tokens | Output tokens | Notes |
|---------|--------------|---------------|-------|
| Free Career Scan | 2,000–4,000 | 800–1,500 | Form fields + system prompt |
| Career X-Ray (deep pass) | 4,000–8,000 | 2,000–4,000 | Includes scan context + 5 roles + skill table |
| Role Intelligence (1 role) | 2,000–3,000 | 1,000–2,000 | Cache per role slug |
| Radar monthly refresh | 3,000–5,000 | 1,000–2,000 | Prior snapshot + market blob |
| Home dashboard (optional) | 0 | 0 | Serve from DB; no LLM |

### Cost per call (Gemini Flash, mid estimate)

| Feature | ~Cost per call |
|---------|----------------|
| Free scan | **$0.001 – $0.003** |
| X-Ray deep pass | **$0.005 – $0.015** |
| Role intelligence (uncached) | **$0.003 – $0.008** |
| Radar monthly update | **$0.003 – $0.010** |

---

## 8. LLM cost model: 1,000 users

### Assumptions (adjust to your funnel)

| Segment | Users | Behavior / month |
|---------|-------|------------------|
| Free only | 600 | 1 scan ever; 50/month rescan or second attempt |
| X-Ray buyers | 250 | 1 X-Ray generation + 2 role intelligence views (cached) |
| Radar subscribers | 150 | 1 initial X-Ray + 1 monthly Radar refresh + 1 rescan |

*Note: segments overlap — Radar includes X-Ray. Numbers are for **planning**, not exact accounting.*

### Monthly LLM spend (steady state, Gemini Flash)

| Workload | Volume | Unit cost | Monthly |
|----------|--------|-----------|---------|
| Free scans | 650 | $0.002 | **$1.30** |
| X-Ray generations | 80 new | $0.010 | **$0.80** |
| Role intelligence (cache miss 20%) | 100 | $0.005 | **$0.50** |
| Radar refresh | 150 | $0.006 | **$0.90** |
| Retries / failures (15%) | — | — | **$0.50** |
| **Total LLM** | | | **~$4 – $15 / month** |

### Stress case (heavy usage)

If users scan repeatedly, share accounts, or you skip caching:

| Scenario | Approximate LLM / month |
|----------|-------------------------|
| 2× scan frequency | $25 – $40 |
| 5× scan frequency | $60 – $120 |
| Free tier abuse (no rate limit) | **Unbounded** — must cap |

**At 1,000 users, LLM is unlikely to be your main cost.** Stripe fees and your time matter more until ~10k+ active scans/month.

### Revenue vs LLM (same cohort, rough)

| Source | Calculation | Monthly |
|--------|-------------|---------|
| Radar | 150 × $9.99 | ~$1,499 |
| X-Ray (amortized) | 250 × $1.99 / 3 months | ~$166 |
| **LLM COGS** | | **~$5 – $15** |
| **LLM as % of revenue** | | **< 1 – 2%** |

Stripe ~2.9% + $0.30 per charge dominates variable COGS.

### Other infra (1,000 users, ballpark)

| Service | Monthly |
|---------|---------|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Domain / email | $5 – $20 |
| Sentry | $0 – $26 |
| **Total infra** | **~$50 – $100** |

---

## 9. How to integrate LLM (patterns)

### 9.1 Server-only calls

- API keys live in **Next.js server env** (`GEMINI_API_KEY`, never `NEXT_PUBLIC_*`).
- Vite `web/` calls **your** API; never calls Gemini directly.

### 9.2 Structured outputs (critical)

Follow what you already do in `matcherGemini.ts`:

1. System prompt with **strict JSON schema**
2. Parse + validate response (Zod or manual guards)
3. On failure: retry once with lower temperature
4. On second failure: return graceful error; optional mock fallback in dev only

Store **raw LLM JSON** in `scan_results.payload jsonb` for debugging and re-rendering.

### 9.3 Prompt versioning

```
prompts/
  scan.txt
  xray.txt
  radar.txt
```

Table column: `prompt_version text`. Lets you improve prompts without breaking old reports.

### 9.4 Caching strategy

| Key | TTL |
|-----|-----|
| `(user_id, input_hash)` scan | Forever (immutable snapshot) |
| `(role_slug, market_snapshot_id)` role intel | Until next market snapshot |
| Radar digest | 30 days / billing period |

### 9.5 Async for long scans

`POST /scan` → create row `status: processing` → return `scanId`  
Client polls `GET /scan/:id` every 1–2s (you already have `/scan-loading` UX)

Alternative: SSE/stream for premium feel (optional).

### 9.6 Idempotency & billing

- **Free scan:** decrement `free_scans_remaining` in transaction **before** LLM call; refund on hard failure.
- **X-Ray:** verify Stripe `payment_intent` or `profiles.has_career_xray` before deep pass.
- **Radar:** verify active subscription + `subscription_expires_at`.

---

## 10. Supabase vs Python vs Django — growing complexity

### Supabase (keep as system of record)

**Use for:**

- `profiles`, entitlements, Stripe customer IDs
- `career_scans`, `xray_reports`, `radar_snapshots` (JSONB)
- Row Level Security (users read own data only)
- Auth sessions for web + mobile
- Storage (exported PDF reports later)
- Edge Functions for **simple** webhooks (optional; you already use Next.js webhooks)

**Schema sketch (V1)**

```sql
-- extends existing profiles
profiles (
  id uuid PK references auth.users,
  email, name, title, ...
  free_scans_remaining int default 1,
  has_career_xray boolean default false,
  has_radar boolean default false,
  subscription_expires_at timestamptz,
  stripe_customer_id text
)

career_scans (
  id uuid PK,
  user_id uuid FK,
  input jsonb,           -- form answers
  result jsonb,          -- free scan output
  resilience_score int,
  status text,           -- processing | complete | failed
  prompt_version text,
  created_at timestamptz
)

xray_reports (
  id uuid PK,
  scan_id uuid FK,
  user_id uuid FK,
  payload jsonb,         -- xrayCompleteReport shape
  created_at timestamptz
)

radar_snapshots (
  id uuid PK,
  user_id uuid FK,
  scan_id uuid FK,
  payload jsonb,
  period_start date,
  created_at timestamptz
)

market_snapshots (
  id uuid PK,
  payload jsonb,
  fetched_at timestamptz
)
```

### Next.js / TypeScript (keep as orchestration layer)

**Use for:**

- All HTTP APIs consumed by Vite web
- Stripe checkout + webhooks
- LLM calls (Gemini SDK or REST)
- Entitlement checks
- Cron via Vercel Cron (`/api/cron/radar-refresh`)

**This is your “backend” for the next 6–12 months.**

### Python (add later, selectively)

**Use for:**

- Scheduled ETL: BLS, O*NET → `market_snapshots`
- PDF resume parsing (if you move beyond plain text)
- Embedding pipeline for “similar roles” (pgvector in Supabase)

**Do not rewrite** auth/billing in Python.

### Django (not recommended for this project now)

| Factor | Django | Your situation |
|--------|--------|----------------|
| Time to ship | Slow (new stack) | Frontend done, Next+Supabase exists |
| Admin UI | Nice | Supabase dashboard + Retool later |
| ORM | Good | Supabase client + SQL migrations enough |
| Team fit | Needs Python team | You’re in TS/React |

**Verdict:** Django only if you hire a Django team and pause Next.js API development — unlikely to be optimal for Future Trace V1.

---

## 11. Mapping V1 screens → backend endpoints

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

## 12. Security & compliance checklist (before public launch)

- [ ] RLS on all user tables
- [ ] Rate limit scans per IP + per user (e.g. 3 free/day max)
- [ ] No PII in LLM logs; redact email in prompts
- [ ] Privacy policy: AI-generated, not career advice
- [ ] Data export + delete (GDPR) — `Future-Trace` already has delete-account route pattern
- [ ] Webhook signature verification (Stripe)
- [ ] `service_role` key only on server

---

## 13. Decision summary

| Question | Answer |
|----------|--------|
| **Next backend step?** | Wire Vite web to Supabase Auth + Next.js `/api/v1` |
| **Best backend stack?** | **Supabase + Next.js API** (extend `Future-Trace`) |
| **Live data MVP?** | Weekly cached market snapshot + LLM synthesis |
| **LLM for everything?** | **No** — LLM for personalization; DB/APIs for auth, billing, storage |
| **Which LLM?** | **Gemini 1.5 Flash** default; Pro/4o-mini for escalation |
| **LLM cost @ 1k users?** | **~$5–15/mo** typical; **<$50** unless abuse/heavy rescanning |
| **Django?** | **Skip for V1** |
| **Python?** | **Optional worker later** for ETL/batch, not core API |
| **Growing complexity?** | Postgres JSONB + prompt versioning + caching + cron; split Python only when batch work hurts Node |

---

## 14. Suggested 30-day execution calendar

| Week | Focus |
|------|--------|
| 1 | Supabase schema for V1, auth in `web/`, entitlements API |
| 2 | Free scan API + Gemini pipeline + persist results |
| 3 | Stripe X-Ray + X-Ray generate endpoint; serve `/xray` from DB |
| 4 | Radar subscription + snapshot storage + manual/cron refresh |

---

## 15. References in your repos

| Item | Path |
|------|------|
| Database design (detailed schema) | `future trace mobile/docs/DATABASE_DESIGN.md` |
| GDPR / CCPA DB patterns (existing) | `Future-Trace/supabase/docs/COMPLIANCE.md` |
| V1 web products | `future trace mobile/web/README.md` |
| Mock entitlements (replace) | `web/src/lib/entitlements.ts` |
| Gemini matcher (reuse pattern) | `Future-Trace/lib/matcherGemini.ts` |
| Scan API example | `Future-Trace/app/api/matcher/scan/route.ts` |
| OpenAI roadmap example | `Future-Trace/lib/analyzeRoadmap.ts` |
| Supabase migrations | `Future-Trace/supabase/migrations/` |
| Stripe webhooks | `Future-Trace/app/api/webhooks/stripe/route.ts` |

---

## 16. Product decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| Career X-Ray price | **$1.99** | `products.price_cents = 199`; Stripe test ID `price_1TfxtpBxBGNjOmXM5gLLn0QZ` |
| Free scan limit | **1 per 7 days** | `usage_limits` + `web/src/lib/accessService.ts` |
| BFF location | **Same monorepo** | Next.js BFF in this repo (`web/` client + `bff/` or equivalent); no new repo |

### Still open

1. **Auth provider:** Email only vs Google/Apple for mobile?
   - *Recommendation:* Match Supabase providers across web + future Expo.

2. **Disclaimer copy:** Legal review for “AI-generated career insights.”

---

*This document is planning-only. No code was implemented as part of its creation.*
