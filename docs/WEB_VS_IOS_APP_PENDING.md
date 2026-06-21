# Future Trace — Web vs iOS App (Pending Work)

**Status:** Living reference  
**Last updated:** June 2026  
**Repo:** `future trace mobile` (monorepo)

This doc clarifies the **two separate apps** in one repo: the **native iOS app** (Expo, repo root) and the **web app** (`web/`). They share branding and `lib/shared/` logic but are different runtimes, entry points, and launch paths.

---

## Why two apps?

| | **Native iOS app** | **Web app** |
|---|---|---|
| **What it is** | Expo React Native app for App Store / Expo Go | Original Future Trace PWA (mobile-first web) |
| **Where in repo** | Repo root: `App.tsx`, `src/`, `components/` | `web/` |
| **How you run it** | `npm run start:ios` (from repo root) | `npm run dev:web` or `npm run dev:full` |
| **Backend** | Mostly on-device; Supabase only for waitlist | Supabase (auth/data) + `bff/` (LLM, Stripe) |
| **Built for** | iOS MVP launch (Phase 1 free) | Full product (auth, paid features, transition plan) |

**Important:** `npm run dev:full` starts **web + BFF only** — it does **not** start the native Expo app.

---

## Repo map

| Path | Purpose |
|---|---|
| `App.tsx`, `src/`, `components/` | Native iOS (Expo) |
| `web/` | Web PWA (React + Vite) |
| `bff/` | API for web: scans, X-Ray generation, Stripe checkout |
| `lib/shared/` | Shared types, rule-based scan, radar, legal HTML, MVP feature flags |
| `lib/ai/` | LLM routing/prompts (web/BFF; not used by native Phase 1 scans) |
| `supabase/` | DB migrations, RLS, `career_xray_waitlist` table |

---

## Feature comparison

| Feature | Native iOS app | Web app |
|---|---|---|
| **Auth (login/signup/OAuth)** | ❌ Not implemented | ✅ Supabase auth |
| **Onboarding** | ✅ One-time Welcome screen | ✅ Multi-slide onboarding |
| **Home dashboard** | ✅ Simple hub (`HomeScreen`) | ✅ Full dashboard (multiple home views) |
| **Career Scan form** | ✅ Native form | ✅ Web form (same IA) |
| **Scan engine** | ✅ Rule-based, on-device | ✅ BFF + OpenRouter/Gemini via API |
| **Scan storage** | ✅ AsyncStorage (local only) | ✅ Supabase `career_scans` |
| **Scan results** | ✅ Native screen | ✅ `/results/:scanId` |
| **AI Disruption Radar (Stable / Evolving / At Risk)** | ✅ On scan results + Radar tab | ✅ `DisruptionRadarCard` on scan results |
| **Career X-Ray purchase ($1.99)** | ❌ Disabled (`MVP_FEATURE_FLAGS`) | ❌ Disabled; checkout code preserved |
| **Career X-Ray generation (LLM)** | ❌ Not wired | ❌ Disabled for MVP; BFF exists |
| **Join Early Access waitlist** | ✅ `WaitlistScreen` → Supabase | ✅ Forms on scan results / X-Ray history |
| **AI Career Transition subscription** | ❌ Coming Soon banner only | ❌ Disabled; upgrade UI preserved |
| **Transition dashboard / milestones** | ❌ Not in native app | ✅ Exists (subscriber-only; purchase disabled) |
| **Profile / account** | ✅ Settings only (no auth profile) | ✅ Full profile, scan history, usage |
| **Privacy / Terms** | ✅ WebView (`LegalWebViewScreen`) | ✅ `/privacy`, `/terms` |
| **Contact support** | ❌ Not on Settings yet | ✅ Profile → `mailto:support@futuretrace.com` |
| **Delete data** | ✅ Clear local AsyncStorage + optional waitlist email | ✅ Delete account + export data |
| **Payments / Stripe** | ❌ None | ❌ Gated off (BFF checkout returns 403) |

---

## Tech and config

| | Native iOS app | Web app |
|---|---|---|
| **Stack** | Expo 54, React Native, React Navigation | Vite, React, React Router, Tailwind |
| **Entry** | `expo/AppEntry.js` → `App.tsx` | `web/src/main.tsx` |
| **Env file** | Repo root `.env` (`EXPO_PUBLIC_SUPABASE_*`) | `web/.env.local` (`VITE_SUPABASE_*`) |
| **Config** | `app.config.js`, `metro.config.js` | `web/vite.config.ts` |
| **Bundle ID** | `com.futuretrace.mobile` | PWA (no App Store bundle) |
| **Test on phone** | Expo Go + `npm run start:ios` | Mobile Safari → Vite dev URL |
| **Shared code** | `lib/shared/*` | `lib/shared/*` + `lib/ai/*` via BFF |

### Run commands

```bash
# Native iOS (Expo Go / simulator)
cd "/Users/sammy/future trace mobile"
npm run start:ios

# Web app only
npm run dev:web

# Web app + BFF (does NOT start Expo)
npm run dev:full
```

### Environment

| App | Required env | Purpose |
|---|---|---|
| **Native** | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in repo root `.env` | Early Access waitlist |
| **Web** | `VITE_SUPABASE_*` in `web/.env.local` | Auth, scans, profile |
| **Web + BFF** | `web/.env.local` + BFF keys (`OPENROUTER_*`, `STRIPE_*`) | LLM scans, checkout (disabled for MVP) |

Copy templates: `.env.example` (root), `web/.env.example`.

---

## MVP feature flags (shared)

Single source: `lib/shared/mvpFlags.ts` (`MVP_FEATURE_FLAGS`).

| Flag | MVP value | Effect |
|---|---|---|
| `careerScanEnabled` | `true` | Core scan flows stay on |
| `paymentsEnabled` | `false` | No Stripe / IAP |
| `careerXrayPurchaseEnabled` | `false` | X-Ray checkout off → Early Access waitlist |
| `aiCareerTransitionPurchaseEnabled` | `false` | Subscription checkout off → Coming Soon banner |
| `subscriptionsEnabled` | `false` | Transition purchase off |
| `premiumMilestoneUnlockingEnabled` | `false` | Month 2+ milestones stay locked (web) |
| `dynamicLaborMarketUpdatesEnabled` | `false` | Plan update RPCs no-op (web) |
| `advancedAiCoachingEnabled` | `false` | Coaching AI features blocked |

Re-enable after EAD by flipping flags in `lib/shared/mvpFlags.ts` (web BFF and UI respect the same flags).

---

## Native iOS app — screens and files

| Screen | File |
|---|---|
| Welcome | `src/screens/WelcomeScreen.tsx` |
| Home | `src/screens/HomeScreen.tsx` |
| Career Scan form | `src/screens/ScanFormScreen.tsx` |
| Scan loading | `src/screens/ScanLoadingScreen.tsx` |
| Scan results | `src/screens/ScanResultsScreen.tsx` |
| AI Disruption Radar | `src/screens/DisruptionRadarScreen.tsx` |
| Early Access waitlist | `src/screens/WaitlistScreen.tsx` |
| Settings | `src/screens/SettingsScreen.tsx` |
| Privacy / Terms | `src/screens/LegalWebViewScreen.tsx` |
| Delete local data | `src/screens/DeleteDataScreen.tsx` |
| Navigation | `src/navigation/RootNavigator.tsx` |
| Local scan storage | `src/lib/scanStorage.ts` |
| Waitlist API | `src/lib/waitlistService.ts` |

---

## Web app — main routes

| Route | Page |
|---|---|
| `/`, `/onboarding`, `/login` | Splash, onboarding, auth |
| `/home` | Dashboard |
| `/scan`, `/scan-loading`, `/results/:scanId` | Career Scan flow |
| `/xray-history`, `/xray/:scanId` | Career X-Ray |
| `/upgrade`, `/checkout/success` | Paywall (checkout disabled for MVP) |
| `/transition/*`, `/notifications` | AI Career Transition (subscriber; purchase disabled) |
| `/profile`, `/privacy`, `/terms` | Account & legal |

---

## Pending work

### Native iOS app

| Priority | Task | Notes |
|---|---|---|
| **P0** | Create repo root `.env` with `EXPO_PUBLIC_SUPABASE_*` | Required for waitlist in Expo Go / production |
| **P0** | `supabase db push` for `career_xray_waitlist` migrations | `20260611000000_*`, `20260611000001_*` |
| **P0** | EAS Build → TestFlight → App Store Connect | Not started |
| **P1** | Contact support on Settings (`mailto:support@futuretrace.com`) | Web has it; native gap |
| **P1** | App Store metadata, privacy URL, screenshots | Use in-app legal HTML or hosted policy URL |
| **P2** | Auth + cloud scan sync | Out of Phase 1 scope unless product direction changes |
| **Phase 2** | Flip MVP flags + IAP for Career X-Ray | Architecture hooks in `lib/shared`; not implemented |

### Web app

| Priority | Task | Notes |
|---|---|---|
| **Done (MVP)** | Disruption Radar on scan results | `DisruptionRadarCard` |
| **Done (MVP)** | Early Access waitlist | `web/src/lib/waitlistService.ts` |
| **Done (MVP)** | Roadmap Coming Soon banner | `FutureFeatureBanner` |
| **Done (MVP)** | Privacy, Terms, support, delete account | Profile + `/privacy`, `/terms` |
| **Optional** | Refactor more web scan logic into `lib/shared` | Reduces drift with native |
| **Phase 2** | Re-enable checkout when `MVP_FEATURE_FLAGS` flipped | BFF + Stripe already wired |

### Shared / backend

| Priority | Task | Notes |
|---|---|---|
| **P0** | Align Supabase project ref across CLI, web `.env`, Expo `.env` | See `supabase/docs/PRODUCTION_SETUP.md` |
| **P0** | Confirm waitlist RLS allows anon insert from web + mobile | Existing migrations |
| **P2** | Single user identity across web + native | Requires auth on native or account linking design |

---

## What to test where

| Goal | Use |
|---|---|
| **iOS MVP in Expo Go / App Store** | Native app — `npm run start:ios` |
| **Full logged-in product, BFF scans, transition UI** | Web — `npm run dev:full` in browser |
| **Early Access waitlist** | Both → `career_xray_waitlist` in Supabase |

---

## Related docs

| Doc | Note |
|---|---|
| [MOBILE_VS_WEB.md](./MOBILE_VS_WEB.md) | Older planning doc; **native app section is outdated** (was splash-only) |
| [PENDING_IMPLEMENTATION_CHECKLIST.md](./PENDING_IMPLEMENTATION_CHECKLIST.md) | Web/BFF integration checklist; partially superseded by current BFF in `bff/` |
| [PRODUCTION_SETUP.md](../supabase/docs/PRODUCTION_SETUP.md) | Supabase production setup |
| [web/README.md](../web/README.md) | Web routes and dev setup |

---

## Decision log

| Decision | Choice | Date |
|---|---|---|
| iOS MVP distribution | Native Expo app (not WebView wrapper) | June 2026 |
| Phase 1 monetization | Off via `MVP_FEATURE_FLAGS`; waitlist instead | June 2026 |
| Native scan engine | Rule-based on-device (`lib/shared/scan/ruleBasedScan.ts`) | June 2026 |
| Web remains in repo | Yes — full product; separate from iOS MVP | June 2026 |
