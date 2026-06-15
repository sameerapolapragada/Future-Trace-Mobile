# Future Trace — Testing Use Cases

**Status:** QA reference  
**Audience:** Engineering, QA, founder  
**Last updated:** June 2026  
**Scope:** Mobile web PWA end-to-end  
**Related:** [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md), [RELEASE_PENDING_TASKS.md](./RELEASE_PENDING_TASKS.md)

---

## Test environments

| Environment | Web | BFF | Supabase | Stripe |
|-------------|-----|-----|----------|--------|
| Local dev | `npm run dev -- --host` | `localhost:3000` or dev plugin | Dev project | Test mode + dev plugin |
| Staging | Preview deploy | Staging BFF | Staging project | Test mode |
| Production | `app.futuretrace.com` | Production BFF | Prod project | Live mode |

**Mobile browsers to test:** iOS Safari, Android Chrome (primary). Desktop Chrome (secondary).

**PWA:** Test install via `npm run build && npm run preview -- --host` over HTTPS or localhost.

---

## 1. Authentication

### TC-AUTH-01 — Sign up (email)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/login`, create account | Account created |
| 2 | Check email confirmation (if enabled) | Confirm link works |
| 3 | Land on `/home` after login | Dashboard loads |
| 4 | Query `user_entitlements` | Row exists; `free_scans_remaining` ≥ 1 |
| 5 | Query `profiles` | Row matches auth user |
| 6 | Query `compliance_logs` | `ACCOUNT_CREATED` logged |

### TC-AUTH-02 — Sign in / sign out

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign out from Profile | Redirects to `/login` |
| 2 | Sign back in | Session persists after refresh |
| 3 | Open protected route while logged out | Redirects to `/login` |

### TC-AUTH-03 — Guest route guard

| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit `/login` while authenticated | Redirects to `/home` |

---

## 2. Free Career Scan

### TC-SCAN-01 — Happy path (first scan)

| Step | Action | Expected |
|------|--------|----------|
| 1 | From `/home`, tap scan CTA | `/scan` form loads |
| 2 | Fill all required fields, submit | `/scan-loading` → `/results/:scanId` |
| 3 | Verify results match submitted roles/skills | Not generic mock if BFF wired |
| 4 | Check `career_scans` + `scan_inputs` | Rows created for user |
| 5 | Profile → Scan History | Scan appears in list |

### TC-SCAN-02 — Usage limit (free tier)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Complete a scan | Success |
| 2 | Attempt second scan within 7 days | Blocked or upgrade prompt |
| 3 | `usage_limits` row | `scans_used` incremented |

### TC-SCAN-03 — Subscriber monthly quota

| Step | Action | Expected |
|------|--------|----------|
| 1 | As subscriber, run scans until 10 used | Profile shows `10/10` |
| 2 | Attempt 11th scan | Clear limit message |

---

## 3. Career X-Ray ($1.99)

### TC-XRAY-01 — Purchase and generate

| Step | Action | Expected |
|------|--------|----------|
| 1 | From scan results, purchase X-Ray | Stripe Checkout opens |
| 2 | Complete test payment | Return to app with success |
| 3 | `user_entitlements` / `career_xrays` | Entitlement + row updated |
| 4 | Generate X-Ray | `/xray/:scanId` loads full report |
| 5 | Report content | Tied to user's scan (not static mock) |

### TC-XRAY-02 — Access without payment

| Step | Action | Expected |
|------|--------|----------|
| 1 | User without X-Ray taps generate | Upgrade/checkout prompt |

### TC-XRAY-03 — X-Ray history

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/xray-history` | Lists scans with X-Ray status |
| 2 | Active goal's scan | Excluded from "explore other goals" if applicable |

---

## 4. AI Career Transition ($9.99/mo)

### TC-SUB-01 — Subscribe

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/upgrade?product=transition` | Upgrade page loads |
| 2 | Complete subscription checkout | Stripe success return |
| 3 | `user_entitlements.has_radar` | true |
| 4 | `subscription_usage` row | Created with 0/10/10/3 |
| 5 | `/transition` | Dashboard loads (not upgrade redirect) |

### TC-SUB-02 — Transition dashboard

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/transition` | Active goal, readiness card, plan updates |
| 2 | Role names | Title case (not lowercase raw) |
| 3 | AI transition plan updates section | Loads without SQL errors |

### TC-SUB-03 — Milestones

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open current week milestone | Tasks load via RPC |
| 2 | Complete a task | Progress updates |
| 3 | Future month milestone | Locked with preview (if applicable) |
| 4 | `get_visible_milestones` | No ambiguous column errors |

### TC-SUB-04 — Plan updates

| Step | Action | Expected |
|------|--------|----------|
| 1 | Tap "Check for updates" | RPC runs |
| 2 | Apply update | Milestone tasks change; toast success |
| 3 | Dismiss update | Status dismissed; plan unchanged |
| 4 | View detail page | Title says "AI Transition Plan Update" |

### TC-SUB-05 — Goal switch limit

| Step | Action | Expected |
|------|--------|----------|
| 1 | Switch active goal 3 times in billing cycle | Success |
| 2 | Attempt 4th switch | Blocked with clear message |

### TC-SUB-06 — Non-subscriber gate

| Step | Action | Expected |
|------|--------|----------|
| 1 | Free user visits `/transition` | Redirect to upgrade |

---

## 5. Profile & account

### TC-PROF-01 — Profile display

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/profile` | Real name, email, career title (title case) |
| 2 | Subscription section | Correct plan badge |
| 3 | Monthly usage (subscriber) | Scans/X-Rays/goal switches counts |
| 4 | Billing cycle reset date | Shown |

### TC-PROF-02 — Navigation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Hamburger menu (top right) | Slide-in menu with all items |
| 2 | No duplicate Settings nav item | Only Profile |
| 3 | Bottom nav | Home, X-Ray, Transition, Profile |

---

## 6. Notifications

### TC-NOTIF-01 — In-app notifications

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/notifications` | Lists scheduled/sent items |
| 2 | Tap plan update notification | Opens plan update detail |
| 3 | Unread badge on bell | Clears after read |

---

## 7. PWA & mobile shell

### TC-PWA-01 — Install prompt

| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit on mobile Chrome (prod build) | Install banner may appear |
| 2 | iOS Safari | "Add to Home Screen" hint shown |
| 3 | Install / add to home screen | Opens standalone (no browser chrome) |

### TC-PWA-02 — Full-bleed layout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Phone viewport | No desktop phone-frame border |
| 2 | Safe area | Content clears notch/home indicator |
| 3 | Desktop (md+) | Phone frame preview optional |

### TC-PWA-03 — Offline shell

| Step | Action | Expected |
|------|--------|----------|
| 1 | Load app online (prod) | SW registers |
| 2 | Go offline, reload | Shell loads; API shows graceful errors |

---

## 8. Payments edge cases

### TC-PAY-01 — Checkout cancel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start checkout, cancel on Stripe | Return to app; no entitlement change |

### TC-PAY-02 — Checkout return

| Step | Action | Expected |
|------|--------|----------|
| 1 | Complete payment | `?checkout=success` handled |
| 2 | Entitlements refresh | UI unlocks without manual refresh |

### TC-PAY-03 — Expired subscription

| Step | Action | Expected |
|------|--------|----------|
| 1 | Set `subscription_expires_at` in past | `/transition` gates; upgrade prompt |

---

## 9. Compliance & privacy

### TC-GDPR-01 — Data minimization cron

| Step | Action | Expected |
|------|--------|----------|
| 1 | Free scan >30 days old, no X-Ray | Removed by `cleanup_old_career_scans` |
| 2 | Scan with X-Ray | Retained |

### TC-GDPR-02 — Account deletion (when wired)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Request delete from Profile | `auth.users` deleted |
| 2 | `career_scans`, `profiles` | Cascaded |
| 3 | `compliance_logs` | Retained with `target_profile_id` |

### TC-GDPR-03 — RLS isolation

| Step | Action | Expected |
|------|--------|----------|
| 1 | User A cannot read User B's scans | PostgREST returns empty/error |

---

## 10. Regression smoke (pre-release, 15 min)

| # | Check |
|---|-------|
| 1 | Sign up → home loads |
| 2 | Run scan → results page |
| 3 | Buy X-Ray (test) → report loads |
| 4 | Subscribe (test) → transition dashboard |
| 5 | Open current milestone → tasks visible |
| 6 | Profile → usage + logout |
| 7 | PWA install on one real phone |
| 8 | No console errors on `/transition` |

---

## Test data setup (SQL)

```sql
-- Verify entitlements for test user
select * from public.user_entitlements where user_id = '<uuid>';

-- Verify active goal
select * from public.career_goals where user_id = '<uuid>' and is_active = true;

-- Verify migrations applied
select * from public.plan_update_recommendations limit 1;
```

---

## Known limitations (June 2026)

| Area | Limitation |
|------|------------|
| Scan/X-Ray content | Mock until BFF + Gemini wired |
| Radar legacy page | Mock data; `/radar` redirects |
| Settings section in Profile | Placeholder rows (notifications, privacy) |
| Account delete / export | Not wired in UI |
| `monthly_career_plan_refresh` cron | Not scheduled |
