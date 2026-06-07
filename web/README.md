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

Mock entitlements persist in `sessionStorage` (demo purchases on upgrade page).

## Run

```bash
cd "/Users/sammy/future trace mobile/web"
npm run dev
```
