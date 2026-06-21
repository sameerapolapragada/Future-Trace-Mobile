# Future-Trace-Mobile

Premium mobile splash screen and V1 web app for the Future Trace AI career intelligence product.

## Run (Expo splash)

```bash
cd "/Users/sammy/future trace mobile"
npm install
npm run start:tunnel
```

Then scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

### If you see "Failed to download remote update"

This means Expo Go on your phone could not reach the dev server. Try in order:

1. **Tunnel mode** (works across networks / guest Wi‑Fi):
   ```bash
   npm run start:tunnel
   ```
2. **Same Wi‑Fi as your Mac** — phone and laptop must be on the same network for default LAN mode.
3. **Update Expo Go** — this project uses **Expo SDK 54** (matches the App Store version of Expo Go).
4. **Clear cache and restart**:
   ```bash
   npm run start:reset
   ```
5. **iOS Simulator on Mac** (no phone needed):
   ```bash
   npm run start:ios
   ```
6. Turn off **VPN** and allow **local network** access for Expo Go in iOS Settings.

Then press `i` for iOS Simulator, `a` for Android, or scan the QR code with Expo Go.

## Run (V1 web app)

```bash
cd web
npm install
npm run dev
```

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE_AND_DATA_FLOWS.md](docs/ARCHITECTURE_AND_DATA_FLOWS.md) | System architecture, LLM/static frequency, compliance risk map |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Technologies, API calls, auth, LLM, Stripe, env vars |
| [docs/RELEASE_PENDING_TASKS.md](docs/RELEASE_PENDING_TASKS.md) | Blocking tasks before public launch |
| [docs/OBSOLETE_DB_TABLES.md](docs/OBSOLETE_DB_TABLES.md) | Supabase tables no longer needed / unused |
| [docs/TESTING_USE_CASES.md](docs/TESTING_USE_CASES.md) | End-to-end QA test cases |
| [docs/GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md) | Pre-launch checklist (Supabase, BFF, PWA, security) |
| [docs/MOBILE_VS_WEB.md](docs/MOBILE_VS_WEB.md) | Mobile vs web strategy, repo layout, native roadmap |
| [docs/PENDING_IMPLEMENTATION_CHECKLIST.md](docs/PENDING_IMPLEMENTATION_CHECKLIST.md) | Week-by-week implementation checklist |
| [docs/BACKEND_AND_LLM_STRATEGY.md](docs/BACKEND_AND_LLM_STRATEGY.md) | Backend, LLM, and cost strategy |
| [docs/AI_ACCESS_AND_MODEL_ROUTING.md](docs/AI_ACCESS_AND_MODEL_ROUTING.md) | Tier-based model routing, caching, and cost rules |
| [docs/FEATURE_1_AND_2_PROCESS_FLOW.md](docs/FEATURE_1_AND_2_PROCESS_FLOW.md) | User flow diagrams for scan and transition |

## Splash screen

The splash UI lives in `components/SplashScreen.tsx` and includes:

- Centered hexagon logo mark with upward arrow
- **Future Trace** title and career-focused tagline
- Subtle abstract timeline/path background motif
- Animated loading indicator

The native Expo splash (`app.json`) uses the same deep navy background (`#0B0D17`) for a seamless handoff on launch.
