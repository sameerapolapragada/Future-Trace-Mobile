# Future Trace — Feature → Data Map

**Status:** Living reference  
**Last updated:** June 2026  
**Repo:** `future trace mobile` (monorepo)

Maps each product feature to **where data is stored** and **which fields** the native iOS app and web app read or write.

Related: [Web vs iOS App](./WEB_VS_IOS_APP_PENDING.md) · Supabase migrations in `supabase/migrations/`

---

## Summary

| Concern | Native iOS app | Web app |
|---|---|---|
| **Career Scan storage** | AsyncStorage `ft_scans_v1` (device only) | `career_scans` + child tables |
| **Auth required?** | No | Yes (`auth.users` → `profiles`) |
| **Email required for Career Scan?** | No | No (account email from signup) |
| **Email collected when?** | Voluntary Early Access waitlist only | Signup **or** voluntary waitlist |
| **Supabase tables touched (MVP)** | `career_xray_waitlist` only | `profiles`, `career_scans`, `scan_*`, `usage_limits`, `career_xray_waitlist`, compliance RPCs |
| **Paid / subscriber tables** | None | `career_xrays`, `subscriptions`, `user_entitlements`, transition plan tables (mostly MVP-gated) |

MVP feature flags: `lib/shared/mvpFlags.ts`

---

## Native iOS app (Expo)

Scans and preferences stay on the device. Supabase is used only for optional Early Access waitlist signups (no auth).

| Feature | Storage | Table / key | Fields used | Read / write | Notes |
|---|---|---|---|---|---|
| **Welcome / onboarding** | Device (AsyncStorage) | `ft_welcome_seen_v1` | `"1"` when seen | Write once, read on launch | No Supabase |
| **Career Scan (form → results)** | Device | `ft_scans_v1` | `id`, `createdAt`, `input`, `result`, `source` | Write on complete; read for results | Rule-based on device; max 20 scans |
| **Scan history** | Device | `ft_scans_v1` | Same as above | Read list; reopen by `id` | Home, Settings, Scan History screen |
| **Scan quota (1/week)** | Device | `ft_scans_v1` | `createdAt` | Read only | Derived from stored scan timestamps |
| **AI Disruption Radar** | None (computed) | — | — | — | From latest local scan; no DB |
| **Career X-Ray Early Access waitlist** | Supabase (+ local fallback) | `career_xray_waitlist` | `email`, `"current_role"`, `"target_role"`, `source`, `created_at` | **Insert only** (anon) | Voluntary email; offline → local draft |
| **Waitlist draft (offline backup)** | Device | `ft_waitlist_draft_v1` | `email`, `currentRole`, `targetRole` | Read / write | When Supabase unavailable |
| **Waitlist email cache** | Device | `ft_waitlist_email_v1` | email string | Read / write | Remembers submitted email |
| **Delete local scan history** | Device | `ft_scans_v1` | — | Delete | Settings → Delete Local Scan History |
| **Delete all local data** | Device | `ft_scans_v1`, `ft_welcome_seen_v1`, `ft_waitlist_email_v1`, `ft_waitlist_draft_v1` | — | Delete | Does not remove server waitlist row |
| **Auth / login** | — | — | — | — | Not implemented |
| **Profile / account** | — | — | — | — | Settings only; no `profiles` row |
| **Payments / X-Ray / Transition** | — | — | — | — | “Coming Soon” UI only |

**Code:** `src/lib/scanStorage.ts`, `src/lib/waitlistService.ts`

### AsyncStorage — `ft_scans_v1` document shape

| Field | Description |
|---|---|
| `id` | Local scan id (`scan_*`) |
| `createdAt` | ISO timestamp |
| `input` | Normalized form input (roles, industry, skills, tools, goal, preference) |
| `result` | Rule-based scan output (scores, profiles, radar status, recommendations) |
| `source` | e.g. `rule_based_v1` |

### Supabase — `career_xray_waitlist` (mobile)

| Column | Type | Mobile usage |
|---|---|---|
| `id` | uuid | Server-generated |
| `email` | text | Required on insert |
| `"current_role"` | text | Optional (quoted — reserved keyword) |
| `"target_role"` | text | Optional |
| `source` | text | Default `ios_app` |
| `created_at` | timestamptz | Server default |

**RLS:** anon **insert** allowed; client **select** blocked.

**Insert mapping** (`src/lib/waitlistService.ts`):

```ts
{ email, current_role, target_role, source: "ios_app" }
```

---

## Web app (PWA)

Authenticated users. Career Scans persist in Supabase. BFF (`bff/`) writes scans and X-Rays via service role when `VITE_API_BASE_URL` is configured.

| Feature | Supabase object | Key fields | Read / write | MVP status |
|---|---|---|---|---|
| **Sign up / sign in / OAuth** | `auth.users` (+ trigger → `profiles`) | `email`, auth metadata | Write via Supabase Auth | Active |
| **User profile** | `profiles` | `id`, `email`, `full_name`, `display_name`, `job_role`, `is_premium` | Read | Active |
| **Career Scan — create** | `career_scans` | `user_id`, `status`, `input_hash`, `result`, `free_result_json`, `"current_role"`, `target_role`, `industry`, `years_experience`, `skills`, `tools`, `career_goal`, `work_preference`, `resilience_score`, `ai_exposure_level`, `summary`, `prompt_version`, `llm_job_id` | Insert, read | Active |
| **Career Scan — inputs** | `scan_inputs` | `scan_id`, `job_title_raw`, `industry_raw`, `years_experience`, `current_skills_text`, `tools_used_text`, `career_goal_text`, `work_preference` | Insert, read (join) | Active |
| **Scan strengths / gaps / opportunities** | `scan_strengths`, `scan_vulnerabilities`, `scan_opportunity_zones` | `scan_id`, `label`, `sort_order` | Insert, read | Active |
| **Scan history / results** | `career_scans` (+ `scan_inputs`) | `id`, scores, `created_at`, joined inputs | Read | Active |
| **Free scan weekly limit** | `usage_limits` | `user_id`, `action_type` (`free_scan`), `window_start`, `window_end`, `count` | Read / insert / update | Active |
| **Free scan limit (fallback)** | `career_scans` | `user_id`, `created_at` | Read (count in window) | Active |
| **Entitlements / subscriber flag** | `user_entitlements` | `user_id`, `has_radar`, `subscription_expires_at`, `xray_source_scan_id` | Read | Active; premium gated |
| **AI Disruption Radar on results** | — (computed) | From `career_scans.result` / `free_result_json` | Read | Active |
| **Career X-Ray — purchase record** | `career_xrays` | `scan_id`, `user_id`, `access_type`, `status`, `stripe_*`, `xray_result_json`, `generated_at` | Insert / read / update | **Disabled** (MVP flags) |
| **Career X-Ray — legacy reports** | `xray_reports` | Report JSON | Read | Legacy |
| **Early Access waitlist** | `career_xray_waitlist` | `email`, `"current_role"`, `"target_role"`, `source` (`web_app`) | Insert only | Active when purchase off |
| **Product catalog** | `products` | `id`, `name`, `description`, `price_cents`, `price_interval`, `stripe_price_id`, `is_active` | Read | UI shown; checkout off |
| **Stripe checkout fulfillment** | `career_xrays`, `user_entitlements`, `subscriptions`, `purchases` | Stripe IDs, entitlement flags | BFF write | **Disabled** (403) |
| **Active subscription lookup** | RPC `get_active_transition_subscription` | Period + product | Read | Gated |
| **Monthly subscriber usage** | `subscription_usage` | `career_scans_used`, `career_xrays_used`, `goal_switches_used`, `month_start`, `month_end` | RPC read / increment | Gated |
| **AI Career Transition — goal** | `career_goals` | `user_id`, `"current_role"`, `target_role`, `source_scan_id`, `source_xray_id`, `status`, `readiness_score`, `plan_length_weeks`, dates | Read / write | Exists; purchase disabled |
| **Weekly milestones** | `weekly_milestones` | `goal_id`, `user_id`, `week_number`, `title`, `description`, `expected_outcome`, `status` | Read / write | Subscriber |
| **Milestone tasks** | `milestone_tasks` | `milestone_id`, `task_type`, `title`, `status`, `sort_order` | Read / write / insert | Subscriber |
| **Goal switch audit** | `goal_switch_history` | Goal + user metadata | Insert | Subscriber |
| **Transition notifications** | `transition_notifications` | `user_id`, `goal_id`, `type`, `status`, schedule fields | Insert / read / update | Subscriber |
| **Visible milestones** | RPC `get_visible_milestones`, `get_visible_milestone_with_tasks` | Goal + week filters | Read | Subscriber |
| **Adaptive plan updates** | `career_market_signals`, `plan_update_recommendations`, `milestone_versions` | Market + recommendation JSON | RPC read / write | **Disabled** |
| **Plan update RPCs** | `refresh_career_market_signals`, `check_plan_updates_for_goal`, `apply_plan_update`, `dismiss_plan_update` | Goal IDs | RPC | Disabled for MVP |
| **LLM job audit (BFF)** | `llm_jobs` | Model, tokens, status | BFF insert | When BFF scan / X-Ray runs |
| **Export my data (GDPR)** | RPC `export_user_data` | Aggregated user JSON | Read | Active |
| **Compliance audit log** | RPC `log_compliance_event` → `compliance_logs` | `p_action` | Insert | Active |
| **Delete account** | BFF `POST /api/v1/me/delete` → cascade from `auth.users` | — | Delete user + related rows | Active (needs BFF) |
| **Legacy resume scans** | `ai_scan_history` | `profile_id`, `email`, `resume_text`, scores | Read / write | Legacy path |

**Code:** `web/src/lib/scanService.ts`, `accessService.ts`, `xrayService.ts`, `transition/transitionService.ts`, `waitlistService.ts`, `complianceService.ts`

### Web — Career Scan write path

| Step | Table | Fields written |
|---|---|---|
| 1 | `career_scans` | `user_id`, `status`, `input_hash`, `result`, scores, optional denormalized role fields, `free_result_json` (BFF) |
| 2 | `scan_inputs` | `scan_id`, `job_title_raw`, `industry_raw`, `years_experience`, `current_skills_text`, `tools_used_text`, `career_goal_text`, `work_preference` |
| 3 | `scan_strengths` / `scan_vulnerabilities` / `scan_opportunity_zones` | `scan_id`, `label`, `sort_order` |
| 4 | `usage_limits` | `user_id`, `action_type`, window + `count` (free tier) |

BFF mirror: `bff/src/services/scans.ts` (same tables via service role REST).

### Supabase — `career_xray_waitlist` (web)

Same schema as mobile. Insert uses `source: "web_app"` from `web/src/lib/waitlistService.ts`.

---

## Shared waitlist table

Both apps insert into **`public.career_xray_waitlist`** with no auth. Email is the only PII required; roles are optional context.

| App | Service file | `source` value |
|---|---|---|
| iOS | `src/lib/waitlistService.ts` | `ios_app` |
| Web | `web/src/lib/waitlistService.ts` | `web_app` |

Migration: `supabase/migrations/20260611000000_career_xray_waitlist.sql`  
Delete policy (anon delete for compliance flows): `20260611000001_career_xray_waitlist_delete.sql`

---

## Tables not used by MVP clients

These exist in migrations for the full product but are not touched by the **native iOS MVP** today:

- `plans`, `plan_features`, `purchases`, `subscriptions`
- `career_goals`, `weekly_milestones`, `milestone_tasks`, `transition_notifications`
- `occupation_roles`, `industries`, career intelligence reference data
- `user_resume_scans` (matcher tier legacy)

Web code may read/write these when MVP flags are re-enabled after EAD.
