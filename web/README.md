# Future Trace Web — V1

Mobile-first web app with three products only:

- **Free** Career Resilience Scan
- **$1.99** Career X-Ray Pass (one-time)
- **$9.99/mo** AI Career Radar

No transformation roadmap, weekly plan, coaching tier, or $39 plan.

## Products

| Product | Price | Route |
|---------|-------|-------|
| Career Resilience Scan | Free | `/scan` → `/scan-loading` → `/canvas` |
| Career X-Ray Pass | $1.99 one-time | `/xray` |
| AI Career Radar | $9.99/month | `/radar` |

## Routes

| Path | Page | Bottom nav |
|------|------|------------|
| `/` | Splash | — |
| `/onboarding` | Onboarding | — |
| `/login` | Login | — |
| `/home` | Home dashboard | ✓ |
| `/scan` | Career scan form | ✓ |
| `/scan-loading` | Scan loading | — |
| `/canvas` | Free results | ✓ |
| `/results` | Free results (alias) | ✓ |
| `/upgrade` | Unlock X-Ray or Radar | — |
| `/xray` | Career X-Ray | ✓ |
| `/radar` | AI Career Radar | ✓ |
| `/profile` | Profile | ✓ |

Bottom nav: **Home · Scan · X-Ray · Radar · Profile**

## Authentication

Supabase Auth (email/password). Session persists via Supabase client (localStorage).

1. Copy `.env.example` → `.env.local` and set your project keys.
2. Sign up or sign in at `/login`.
3. Protected routes redirect to `/login` when signed out.
4. Signed-in users visiting `/login` are redirected to `/home`.

Auth modules: `src/lib/supabaseClient.ts`, `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/ProtectedRoute.tsx`.

Mock product entitlements still use `sessionStorage` (separate from auth).

## Run

```bash
cd "/Users/sammy/future trace mobile/web"
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev
```
