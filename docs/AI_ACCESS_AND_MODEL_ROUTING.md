# Future Trace — AI Access & Model Routing

**Audience:** Engineering  
**Last updated:** June 2026  
**Implementation:** `lib/ai/` (shared), `web/src/lib/ai/` (client helpers), BFF (Future-Trace repo)

---

## Core principle

**Do not call paid models unless revenue has been generated for that feature.**

Resolution order (always):

```
STATIC DATA → CACHE → OPENROUTER FREE → GEMINI FLASH → GEMINI PRO
```

Never escalate above the tier allowed for the user's plan and purchase state.

---

## Tiers

| Tier | Trigger | Model | Features |
|------|---------|-------|----------|
| **0 — Free** | Default | OpenRouter free | Career Profile Scan, Current Role Analysis, Readiness Score, limited skill gaps & recommendations |
| **1 — Career X-Ray** | One-time $2.99 purchase | Gemini 2.5 Flash (once) | Top 5 roles, transferability, salary, skill gaps, risk score — **persisted permanently** |
| **2 — AI Career Transition** | $9.99/mo subscription | Gemini 2.5 Flash | Weekly milestones, chat, coaching, resume, interview, market radar |
| **Premium refresh** | Subscriber + 30 days since last Pro run | Gemini 2.5 Pro | Roadmap, skill priorities, market opportunities, transition strategy |

---

## Routing API

```typescript
import { orchestrate, buildAccessContext } from "@ft/ai";

const context = buildAccessContext({
  hasTransitionSubscription: true,
  hasCareerXrayPurchase: false,
  hasExistingXrayResult: false,
  hasExistingScanResult: false,
  lastPremiumRefreshAt: goal.last_premium_refresh_at,
  scanId,
  goalId,
});

const route = orchestrate("career_xray_report", context, {
  hasStaticAnswer: false,
  hasCacheHit: Boolean(cached),
  cacheKey: `xray:${userId}:${scanId}`,
});

if (!route.allowed) throw new Error(route.reason);
if (route.reuseExisting) return existingRecord;
// Call route.model via BFF provider adapter
```

### Model IDs

| Source | Model constant |
|--------|----------------|
| Static | `static` |
| Cache | `cache` |
| OpenRouter free | `openrouter/free` |
| Gemini Flash | `google/gemini-2.5-flash` |
| Gemini Pro | `google/gemini-2.5-pro` |

---

## Free scan rate limit

| User type | Limit | UI |
|-----------|-------|-----|
| Free | 1 scan / 7 days | “Your next free scan will be available in X days.” |
| Subscriber | 10 scans / month | Monthly quota badge |

Tracked in `usage_limits` (free) and `subscription_usage` (paid).  
Client: `accessService.getWeeklyScanStatus()` → `entitlements.nextScanEligibleAt`.

---

## Persistence rules

### Career X-Ray (`career_xrays`)

Store once on generation; never regenerate unless user purchases again:

- `xray_result_json` — full report
- `generated_at`
- Denormalized: `readiness_score`, `transition_difficulty`, etc.

Orchestrator returns `reuseExisting: true` when `status = generated`.

### Career Transition (`career_goals`)

| Column | Purpose |
|--------|---------|
| `roadmap_json` | Persisted roadmap output |
| `last_refresh_at` | Last Flash refresh |
| `last_premium_refresh_at` | Last Pro refresh (30-day gate) |

Related: `weekly_milestones`, `career_market_signals`.

### Cache (`content_cache`)

Service-role only. Keys via `lib/ai/cacheKeys.ts`:

- `scan:{userId}:{inputHash}`
- `xray:{userId}:{scanId}`
- `roadmap-premium:{userId}:{goalId}`

---

## BFF integration checklist

1. Load context via `get_ai_access_context(user_id, scan_id, goal_id)` RPC (service role) or mirror client logic.
2. Call `orchestrate()` before any LLM request.
3. Check `content_cache` when `route.source === "cache"`.
4. Write `llm_jobs` with `model`, `prompt_version`, token counts.
5. Persist outputs to the appropriate table — **never regenerate stored data**.
6. For X-Ray: single Gemini Flash call per purchase.
7. For premium refresh: enforce `PREMIUM_REFRESH_COOLDOWN_DAYS` (30) before Pro.

### Endpoints

| Endpoint | Feature | Model |
|----------|---------|-------|
| `POST /api/v1/scans` | `career_profile_scan` | OpenRouter (free) or Flash (subscriber) |
| `POST /api/v1/xray/generate` | `career_xray_report` | Flash once; then existing record |
| Transition chat / coaching | `transition_chat`, etc. | Flash (subscriber) |
| Monthly / on-demand premium refresh | `premium_roadmap_refresh` | Pro (≥30 days) |

---

## Cost target

Keep AI COGS **under $0.50/subscriber/month** by:

- Defaulting free tier to OpenRouter free models
- Reusing scans via `input_hash` dedupe
- Never re-running X-Ray generation
- Gating Gemini Pro to 30-day premium refreshes only
- Serving dashboards from Postgres, not LLM

---

## Files

| Path | Role |
|------|------|
| `lib/ai/types.ts` | Tiers, features, context types |
| `lib/ai/features.ts` | Feature → tier mapping |
| `lib/ai/router.ts` | Entitlement-based model selection |
| `lib/ai/resolver.ts` | Static/cache priority chain |
| `lib/ai/orchestrator.ts` | Main `orchestrate()` entry |
| `lib/ai/cacheKeys.ts` | Cache key builders |
| `web/src/lib/ai/clientAccess.ts` | Supabase-backed context loader |
| `supabase/migrations/20260610900000_ai_orchestration_layer.sql` | Goal refresh columns + RPC |

---

## Environment (BFF only)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Flash + Pro |
| `OPENROUTER_API_KEY` | Free-tier scans |
| `OPENROUTER_FREE_MODEL` | Optional override (default: Llama 3.2 3B free) |

Never expose these in the Vite client bundle.
