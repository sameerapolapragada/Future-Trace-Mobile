# Future Trace — Architecture & Data Flows

**Status:** Reference (as-built + target)  
**Audience:** Engineering, compliance review  
**Last updated:** June 2026  
**Scope:** Mobile web (`web/`), Future-Trace BFF, Supabase  
**Related:** [TECH_STACK.md](./TECH_STACK.md), [OBSOLETE_DB_TABLES.md](./OBSOLETE_DB_TABLES.md), [BACKEND_AND_LLM_STRATEGY.md](./BACKEND_AND_LLM_STRATEGY.md)

---

## 1. System overview

Future Trace is a **mobile-first PWA** (`web/`) backed by **Supabase** (auth + Postgres) and a **Next.js BFF** (`Future-Trace/`, separate repo) for LLM orchestration and Stripe. The Expo app at the repo root is splash-only; production users run the web app in a browser or as an installed PWA.

```mermaid
flowchart TB
  subgraph clients [Clients]
    PWA["Mobile web PWA<br/>web/"]
    Expo["Expo shell<br/>splash only"]
  end

  subgraph edge [Edge / CDN]
    Static["Static assets<br/>HTML, JS, CSS, SW"]
  end

  subgraph bff [Future-Trace BFF — server only]
    API["/api/v1/*"]
    WH["Stripe webhooks"]
    Cron["Vercel / pg_cron jobs"]
  end

  subgraph supabase [Supabase]
    Auth["Auth (JWT)"]
    DB[(Postgres + RLS)]
    RPC["RPC functions"]
  end

  subgraph third [Third parties]
    Stripe["Stripe Checkout"]
    Gemini["Google Gemini<br/>GEMINI_API_KEY"]
    BLS["BLS / O*NET<br/>batch only — planned"]
  end

  PWA --> Static
  PWA --> Auth
  PWA --> DB
  PWA --> RPC
  PWA --> API
  Expo -.->|future WebView| PWA
  API --> Auth
  API --> DB
  API --> Gemini
  API --> Stripe
  WH --> DB
  Cron --> DB
  Cron --> Gemini
  Cron --> BLS
```

---

## 2. Layered architecture

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Presentation** | React 19, Vite, Tailwind, React Router | UI, routing, PWA shell, bottom nav |
| **Client services** | `web/src/lib/*` | Supabase reads/writes, checkout client, transition logic |
| **Auth** | Supabase Auth | Email/password, OAuth, JWT sessions |
| **Data** | Supabase Postgres + RLS | User data, scans, X-Rays, goals, milestones |
| **BFF** | Future-Trace Next.js | LLM calls, Stripe, webhooks, cron — **keys never in browser** |
| **LLM** | Gemini 1.5 Flash (default) | Scan, X-Ray, plan-update signal copy — **server only** |
| **Payments** | Stripe Checkout + webhooks | $1.99 X-Ray, $9.99/mo AI Career Transition |
| **Static market data** | Seeded tables + weekly batch (planned) | Role taxonomy, benchmarks, market snapshots |

---

## 3. Request flows (by feature)

### 3.1 Authentication

```mermaid
sequenceDiagram
  participant U as User (PWA)
  participant W as web/src
  participant A as Supabase Auth
  participant DB as Postgres

  U->>W: Login / sign up
  W->>A: signIn / signUp
  A-->>W: JWT session
  Note over A,DB: Trigger handle_new_user_signup()
  DB-->>DB: profiles + user_entitlements + compliance_logs
  W->>W: ProtectedRoute checks session
```

**Compliance note:** Email is PII stored in `auth.users` and `profiles`. Display name sent as auth metadata.

---

### 3.2 Free Career Scan

```mermaid
sequenceDiagram
  participant U as User
  participant W as web client
  participant B as BFF
  participant G as Gemini
  participant DB as Supabase

  U->>W: Submit scan form
  alt Target (BFF wired)
    W->>B: POST /api/v1/scans
    B->>DB: Insert career_scans (queued)
    B->>G: Generate scan JSON
    G-->>B: Structured result
    B->>DB: Update result + child rows
    W->>B: GET /api/v1/scans/:id (poll)
  else Current (mock-first)
    W->>W: buildMockFreeResult()
    W->>DB: Insert career_scans + scan_* tables
  end
  W->>U: /results/:scanId
```

| Aspect | Detail |
|--------|--------|
| **LLM?** | **Yes** (target) — once per unique input hash; cached on repeat |
| **Frequency** | On user submit; free tier: 1 scan / 7 days (`usage_limits`) |
| **Static data?** | Role taxonomy (`occupation_roles`) optional enrichment — **weekly batch**, not per request |
| **Compliance** | Form PII in `scan_inputs` (job title, skills, goals). Retention: free scans **>30 days** purged if no X-Ray/sub (`cleanup_old_career_scans`) |

---

### 3.3 Career X-Ray ($1.99)

```mermaid
sequenceDiagram
  participant U as User
  participant W as web client
  participant B as BFF
  participant S as Stripe
  participant G as Gemini
  participant DB as Supabase

  U->>W: Purchase X-Ray
  W->>B: POST /api/v1/checkout
  B->>S: Create Checkout Session
  S-->>U: Payment
  S->>B: Webhook payment_intent.succeeded
  B->>DB: user_entitlements + career_xrays
  U->>W: Generate X-Ray
  W->>B: POST /api/v1/xray/generate
  B->>G: Deep pass on scan context
  G-->>B: X-Ray JSON
  B->>DB: career_xrays.xray_result_json
  W->>U: /xray/:scanId
```

| Aspect | Detail |
|--------|--------|
| **LLM?** | **Yes** — one deep pass per X-Ray generation |
| **Frequency** | On demand after payment; subscribers: up to **10 X-Rays/month** |
| **Static data?** | Cached role intelligence (planned) — **read from DB**, LLM only on cache miss |
| **Compliance** | Payment records; X-Ray contains inferred career PII — same retention as `career_scans` |

---

### 3.4 AI Career Transition ($9.99/mo)

```mermaid
flowchart LR
  subgraph onDemand [On demand — no LLM]
    G1[Activate goal]
    M1[generateWeeklyMilestones<br/>client templates]
    T1[Task completion]
    N1[Notifications]
  end

  subgraph monthly [Monthly — LLM optional]
    R1[refresh_career_market_signals RPC]
    C1[check_plan_updates_for_goal RPC]
    P1[Plan update recommendations]
  end

  subgraph cron [Scheduled — not yet wired]
    CRON[monthly_career_plan_refresh]
  end

  G1 --> M1
  CRON --> R1 --> C1 --> P1
```

| Operation | LLM? | Frequency |
|-----------|------|-----------|
| Milestone generation | **No** (template-based in `generateWeeklyMilestones.ts`) | Once per goal activation |
| Milestone unlock sync | **No** (RPC `sync_milestone_unlocks`) | On milestone fetch |
| Market signals refresh | **Partial** — RPC seeds signals; full LLM enrichment via BFF (planned) | **Monthly** per active goal / subscriber |
| Plan update check | **Partial** — server RPC + client draft logic | User-initiated or **monthly cron** |
| Notification scheduling | **No** | On milestone events |

---

## 4. LLM vs static data — frequency matrix

| Workload | LLM runs | Static / DB reads | Trigger | Target cadence |
|----------|----------|-------------------|---------|----------------|
| Free Career Scan | **Yes** | Optional market snapshot JSON | User submit | **Per scan** (cached by input hash) |
| Career X-Ray | **Yes** | Prior scan result | User after payment | **Per X-Ray** (≤10/mo subscriber) |
| Role intelligence page | **Yes** (cache miss) | `occupation_roles`, cached report | User navigation | **Once per role slug**, then DB |
| AI transition milestones | **No** | Blueprint templates in code | Goal activation | **Once per goal** |
| Plan update recommendations | **Light** (signal copy) | `career_market_signals` | Manual check or cron | **Monthly** |
| Radar dashboard (legacy) | **Yes** (planned) | `radar_snapshots` | Monthly cron | **1×/month/subscriber** |
| Home dashboard | **No** | `career_goals`, milestones, entitlements | Page load | **Every visit** (DB only) |
| Market benchmarks | **No** | `salary_observations`, `role_demand_*` (seeded) | Batch ETL | **Weekly** (planned) |
| BLS / O*NET ingest | **No** | External APIs → `market_snapshots` | Cron | **Weekly** (planned) |
| Entitlements / usage | **No** | `user_entitlements`, `subscription_usage` | Every gated action | **Real-time** |

**Rule of thumb:** LLM runs on **user-initiated intelligence** (scan, X-Ray) and **scheduled personalization** (monthly plan/radar refresh). Everything else is **Postgres + static seeds**.

---

## 5. Compliance & privacy risk map

Legend: 🔴 High sensitivity · 🟡 Medium · 🟢 Low

```mermaid
flowchart TB
  subgraph pii [PII & career data — 🔴]
    AUTH["Supabase Auth<br/>email, user id"]
    PROF["profiles<br/>name, job_role"]
    SI["scan_inputs<br/>job title, skills, goals"]
    CS["career_scans.result"]
    XR["career_xrays.xray_result_json"]
    CG["career_goals<br/>current/target role"]
  end

  subgraph pay [Payment — 🟡]
    UE["user_entitlements"]
    SU["subscription_usage"]
    STR["Stripe<br/>card via Stripe only"]
  end

  subgraph audit [Audit — 🟡]
    CL["compliance_logs<br/>survives deletion"]
    GSH["goal_switch_history"]
    MV["milestone_versions"]
  end

  subgraph llmRisk [LLM boundary — 🔴]
    BFF["BFF sends career fields<br/>NEVER send email to Gemini"]
    LJ["llm_jobs.raw_response<br/>redacted after 90d"]
  end

  subgraph public [Reference data — 🟢]
    OR["occupation_roles, skills"]
    MS["market_snapshots seeds"]
  end

  SI --> BFF
  CS --> BFF
  BFF --> LJ
  AUTH --> CL
```

### 5.1 Risk areas & mitigations

| Area | Risk | Current mitigation | Gap |
|------|------|-------------------|-----|
| **Scan form → LLM** | Career PII in prompts | BFF-only; no client LLM | Enforce redaction checklist in BFF prompts |
| **scan_inputs** | Immutable PII store | RLS: own rows only | Export/delete UX not wired in Profile |
| **career_scans retention** | 30-day purge for free tier | `cleanup_old_career_scans` cron daily | Confirm cron enabled in Supabase Dashboard |
| **llm_jobs.raw_response** | Full LLM payloads | Redacted after 90 days | Ensure BFF writes to `llm_jobs` |
| **compliance_logs** | Survives account delete | By design (legal audit) | Wire `log_compliance_event` from delete flow |
| **Stripe** | PCI | Stripe Checkout hosted | No card data in Supabase ✓ |
| **Service role key** | Full DB access | Server/dev only | Never `VITE_*` expose |
| **sessionStorage** | Client-side entitlements legacy | Mostly replaced by `user_entitlements` | Audit remaining mock paths |
| **Third-party fonts** | Google Fonts CDN | External request | Self-host for strict privacy policy |
| **PWA service worker** | Caches shell offline | Network-first for API | Do not cache authenticated API responses in SW |

### 5.2 Data retention summary

| Data | Retention | Mechanism |
|------|-----------|-----------|
| Free-tier scans | 30 days | `cleanup_old_career_scans()` — daily cron |
| Paid X-Ray / subscriber scans | Until account delete | Cascade from `auth.users` |
| `llm_jobs.raw_response` | 90 days then redacted | `cleanup_old_llm_jobs()` — daily cron |
| Integration staging | 30 days | `cleanup_integration_staging_raw()` |
| `compliance_logs` | Indefinite | Audit trail |

See [supabase/docs/COMPLIANCE.md](../supabase/docs/COMPLIANCE.md).

---

## 6. Security boundaries

```mermaid
flowchart LR
  subgraph browser [Browser — untrusted]
    React["React app"]
  end

  subgraph trusted [Trusted server]
    BFF2["Future-Trace API"]
    SR["Supabase service role"]
  end

  subgraph safe [Supabase — RLS]
    Anon["Anon key + user JWT"]
  end

  React -->|"JWT only"| Anon
  React -->|"JWT only"| BFF2
  BFF2 --> SR
  BFF2 -->|"GEMINI_API_KEY"| Gemini2["Gemini"]
  Anon -.->|"blocked by RLS"| SR
```

**Never in the browser:** `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 7. Deployment topology (target production)

| Component | Host | URL pattern |
|-----------|------|-------------|
| PWA | Vercel / Netlify / Cloudflare Pages | `app.futuretrace.com` |
| BFF | Vercel (Future-Trace) | `api.futuretrace.com` or same-origin `/api` proxy |
| Database | Supabase Cloud | Project-specific |
| Stripe | Stripe Dashboard | Webhooks → BFF |
| Cron | Supabase pg_cron + Vercel cron | Daily cleanup + monthly plan refresh |

---

## 8. Current vs target state

| Capability | Current (June 2026) | Target for go-live |
|------------|---------------------|-------------------|
| Scan content | Mock templates in `scanService.ts` | BFF + Gemini |
| X-Ray content | Mock fallback if BFF fails | BFF + Gemini required |
| Checkout | Dev plugin + partial BFF | Production Stripe webhooks |
| Transition milestones | Real DB, template-generated | Same (no LLM required) |
| Plan updates | Real RPCs when migrations applied | + monthly cron |
| Radar UI | Redirects to `/transition`; legacy mock page | Deprecated or wired to snapshots |
| PWA | Manifest + SW + install prompt | ✓ Done |
| Market data ETL | Tables seeded, no live ingest | Weekly batch (post-MVP OK) |
