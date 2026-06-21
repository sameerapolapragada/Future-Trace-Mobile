# Future Trace — Release Pending Tasks

**Status:** Blocking go-live  
**Audience:** Sammy  
**Last updated:** June 2026  
**Scope:** Mobile web PWA (`web/`) + Future-Trace BFF + Supabase  
**Related:** [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md), [PENDING_IMPLEMENTATION_CHECKLIST.md](./PENDING_IMPLEMENTATION_CHECKLIST.md)

---

## Summary

The **UI and mobile shell are largely complete** (PWA, bottom nav, hamburger menu, transition dashboard, profile, checkout dev flow). **Go-live is blocked** primarily by replacing mock intelligence with real BFF + Gemini pipelines and production Stripe.

**Estimated critical path:** 2–4 weeks (BFF + Stripe + scan/X-Ray real data).

---

## P0 — Must complete before any public launch

### 1. Real scan generation (replace mock)

| Task | Owner | Files / systems |
|------|-------|-----------------|
| Implement `POST /api/v1/scans` + poll endpoint in Future-Trace BFF | BFF | `Future-Trace/app/api/v1/scans/` |
| Wire `CareerScanPage` → API instead of `buildMockFreeResult()` | Web | `scanService.ts`, `CareerScanPage.tsx`, `ScanLoadingPage.tsx` |
| Gemini prompt + JSON schema matching `CareerScan` type | BFF | `lib/scanGemini.ts` |
| Log jobs to `llm_jobs`; idempotency on input hash | BFF + DB | |
| Verify `usage_limits` / `subscription_usage` decrement on scan | Web + DB | `accessService.ts` |

**Done when:** A new user can submit a real form and see **unique** LLM-generated results (not `mockData` templates).

---

### 2. Production Stripe + entitlements

| Task | Owner | Files / systems |
|------|-------|-----------------|
| Deploy Future-Trace BFF with `VITE_API_BASE_URL` pointing to production | Ops | `web/.env.production` |
| Stripe live mode products: X-Ray $1.99, Transition $9.99/mo | Stripe Dashboard | `products.stripe_price_id` in Supabase |
| Webhook handler: `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.*` | BFF | `app/api/webhooks/stripe/` |
| Remove reliance on dev-only `checkoutDevPlugin` in production builds | Web | `vite.config.ts` — proxy only in dev |
| Test full funnel: free scan → X-Ray purchase → subscription → `/transition` access | QA | See [TESTING_USE_CASES.md](./TESTING_USE_CASES.md) |

**Done when:** Payments work on mobile Safari/Chrome with live Stripe test → live keys; entitlements persist across devices.

---

### 3. Real X-Ray generation

| Task | Owner | Files / systems |
|------|-------|-----------------|
| `POST /api/v1/xray/generate` calls Gemini with scan context | BFF | Already stubbed in `xrayService.ts` |
| Remove `buildMockXrayResult()` as default path | Web | `xrayService.ts` |
| Store result in `career_xrays.xray_result_json` | BFF | |
| X-Ray pages read from `career_xrays`, not `mockData.xrayCompleteReport` | Web | `CareerXRayCompleteView.tsx`, `XRayDetailPage.tsx` |

**Done when:** Paid X-Ray shows content derived from the user's actual scan.

---

### 4. Supabase production hardening

| Task | Detail |
|------|--------|
| All migrations pushed to production project | `supabase db push` |
| pg_cron jobs enabled in Dashboard | 3 daily cleanup jobs |
| Schedule `monthly_career_plan_refresh()` | Service-role cron (not yet scheduled) |
| RLS audit on all user tables | See `20260605120100_career_intelligence_compliance_rls.sql` |
| Auth: email confirmation policy decided | Supabase Dashboard setting |

---

### 5. Environment & secrets

| Variable | Where |
|----------|-------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Web production |
| `VITE_API_BASE_URL` | Web production → BFF URL |
| `GEMINI_API_KEY` | BFF only |
| `STRIPE_SECRET_KEY`, webhook secret | BFF only |
| `SUPABASE_SERVICE_ROLE_KEY` | BFF only — never in Vite |

---

## P1 — Should complete for quality launch

| # | Task | Notes |
|---|------|-------|
| 6 | Error monitoring (Sentry) | Client + BFF |
| 7 | Rate limiting on `POST /api/v1/scans` | Per user + IP |
| 8 | Account deletion flow in Profile | Calls BFF + `log_compliance_event` |
| 9 | Data export (GDPR) | RPC or BFF endpoint |
| 10 | AI disclaimer copy on scan/X-Ray results | Legal |
| 11 | OAuth: Google (Apple before App Store wrapper) | `LoginPage.tsx` |
| 12 | Code-split main bundle (~800KB) | Performance on mobile networks |
| 13 | HTTPS deploy + correct CORS for BFF | Required for PWA + Stripe |

---

## P2 — Post-launch / traction

| # | Task | Notes |
|---|------|-------|
| 14 | Weekly BLS/O*NET market data batch | `market_snapshots` tables exist |
| 15 | Wire legacy Radar snapshots or remove `/radar-legacy` | Tables exist; UI uses mocks |
| 16 | Expo WebView shell for App Store | Reuses 100% of `web/` |
| 17 | Push notifications (email first, native later) | Milestone reminders |
| 18 | Deprecate obsolete DB tables | See [OBSOLETE_DB_TABLES.md](./OBSOLETE_DB_TABLES.md) |
| 19 | Full responsive desktop web shell | After mobile traction |

---

## Already completed (do not re-do)

| Area | Status |
|------|--------|
| V1 UI (scan, X-Ray, transition, profile, upgrade) | ✓ |
| Supabase Auth client + protected routes | ✓ |
| Transition goals, milestones, plan updates (DB + RPCs) | ✓ |
| Subscription usage limits (10/10/3 monthly) | ✓ |
| Mobile PWA (manifest, SW, install prompt) | ✓ |
| Full-bleed mobile shell + hamburger nav | ✓ |
| Profile: real user, scan history, monthly usage | ✓ |
| Dev Stripe checkout plugin | ✓ (dev only) |

---

## Suggested PR / sprint order

1. **Sprint 1:** BFF scan endpoint + Gemini + wire scan flow (P0 #1)
2. **Sprint 2:** Production Stripe webhooks + entitlements (P0 #2)
3. **Sprint 3:** X-Ray generate + remove mocks (P0 #3)
4. **Sprint 4:** Supabase cron + compliance flows (P0 #4, P1 #7–10)
5. **Sprint 5:** Deploy + go-live checklist (see [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md))

---

## Resolved product decisions (June 2026)

| Decision | Choice | Status |
|----------|--------|--------|
| Career X-Ray price | **$1.99** one-time per scan | Stripe test price IDs seeded in `products` (`price_1TfxtpBxBGNjOmXM5gLLn0QZ`) |
| Free scan limit | **1 per 7 days** | Implemented — `usage_limits` + `accessService.ts` (`FREE_SCANS_PER_WEEK = 1`) |
| BFF repo location | **Same monorepo** (`future trace mobile`) | No separate `Future-Trace` repo; add BFF here (Next.js API routes) |

## Still open before Sprint 1

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Auth providers at launch | Email only vs + Google | **Email + Google** for mobile funnel |
