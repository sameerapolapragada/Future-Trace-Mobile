# Future Trace V1 — Design System

Mobile-first, premium, futuristic UI for career intelligence.

V1 supports three products only: free scan, $1.99 Career X-Ray Pass, and $9.99/mo AI Career Radar.

## Import

```tsx
import {
  AppShell,
  BottomNav,
  PrimaryButton,
  SecondaryButton,
  Card,
  ScoreCircle,
  ProgressBar,
  SkillChip,
  RoleCard,
  SignalCard,
  PaywallCard,
  SectionHeader,
} from "../design-system";
```

## Components

| Component | Purpose |
|-----------|---------|
| **AppShell** | Max-width mobile container, shell header, bottom nav slot |
| **BottomNav** | V1 tab bar — Home, Scan, X-Ray, Radar, Profile |
| **PrimaryButton** | Gradient CTA with glow shadow |
| **SecondaryButton** | Glass-bordered secondary action |
| **Card** | Glass surface — `default`, `elevated`, `gradient` |
| **ScoreCircle** | Resilience / match score ring |
| **ProgressBar** | AI exposure, skill levels |
| **SkillChip** | Durable skill tags |
| **RoleCard** | Target role list item |
| **SignalCard** | Radar market intelligence signal |
| **PaywallCard** | X-Ray ($1.99) or Radar ($9.99/mo) unlock |
| **SectionHeader** | In-page section title + optional action |

## Tokens (`tokens.css`)

- **Navy** `#0B0D17` — app background
- **Accent** `#3498DB` — primary actions
- **Purple** `#4D47C2` — gradients, glow
- Utilities: `ft-glass`, `ft-glass-elevated`, `ft-gradient-text`, `ft-focus-ring`

## Principles

Premium · Futuristic · Professional · Career intelligence focused
