import { formatCycleResetDate } from "../lib/subscriptionUsageService";
import type { MonthlyUsageSnapshot } from "../types";

export function MonthlyUsageCard({ usage }: { usage: MonthlyUsageSnapshot }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Monthly Usage</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex justify-between gap-3">
          <span className="text-muted">Career Scans</span>
          <span className="font-medium tabular-nums text-white">
            {usage.careerScansUsed} / {usage.careerScansLimit} used
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-muted">Career X-Rays</span>
          <span className="font-medium tabular-nums text-white">
            {usage.careerXraysUsed} / {usage.careerXraysLimit} used
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-muted">Goal Switches</span>
          <span className="font-medium tabular-nums text-white">
            {usage.goalSwitchesUsed} / {usage.goalSwitchesLimit} used
          </span>
        </li>
      </ul>
      <p className="mt-3 text-[10px] text-muted">
        Billing cycle resets: {formatCycleResetDate(usage.cycleResetDate)}
      </p>
    </section>
  );
}
