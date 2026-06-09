import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogoMark, PrimaryButtonLink, ScoreCircle } from "../design-system";
import type { ExplorationXray } from "../lib/transition/transitionService";
import type { CareerGoal, WeeklyMilestone, WeeklyMilestoneWithTasks } from "../types/transition";
import { cn } from "../lib/cn";

type ActiveGoalHomeViewProps = {
  displayName: string;
  goal: CareerGoal;
  milestones: WeeklyMilestone[];
  currentMilestone: WeeklyMilestoneWithTasks | null;
  scanTo: string;
  isPro: boolean;
  latestScanId?: string;
  explorationXrays?: ExplorationXray[];
};

export function ActiveGoalHomeView({
  displayName,
  goal,
  milestones,
  currentMilestone,
  scanTo,
  isPro,
  latestScanId,
  explorationXrays = [],
}: ActiveGoalHomeViewProps) {
  const timeEstimate = estimateTimeToGoal(goal, milestones, currentMilestone);
  const weeklyImpactLow = 5;
  const weeklyImpactHigh = 8;
  const completedTasks =
    currentMilestone?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = currentMilestone?.tasks.length ?? 0;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark size={36} className="shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">Welcome, {displayName}</h1>
              {isPro ? (
                <span className="rounded bg-accent-purple/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-purple">
                  Pro
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-muted">Your AI Career Intelligence Dashboard</p>
          </div>
        </div>
      </header>

      <ActiveGoalHeroCard
        goal={goal}
        timeEstimate={timeEstimate}
        currentWeek={currentMilestone?.weekNumber}
        dueDate={currentMilestone?.dueDate}
        weeklyImpactLow={weeklyImpactLow}
        weeklyImpactHigh={weeklyImpactHigh}
      />

      <QuickActionsGrid goalId={goal.id} scanTo={scanTo} latestScanId={latestScanId} />

      {currentMilestone ? (
        <ThisWeekSection
          goal={goal}
          milestone={currentMilestone}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
        />
      ) : null}

      {explorationXrays.length > 0 ? (
        <RecentExplorationsSection items={explorationXrays} />
      ) : null}
    </div>
  );
}

function RecentExplorationsSection({ items }: { items: ExplorationXray[] }) {
  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">
        Recent career explorations
      </h2>
      <ul className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <li
            key={item.xrayId}
            className="rounded-2xl border border-accent-purple/25 bg-navy-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent-purple">Analyze</p>
                <p className="mt-1 text-sm font-bold text-white">{item.targetRole}</p>
                <p className="mt-0.5 text-xs text-muted">From {item.currentRole}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-accent-purple/15 px-2 py-1 text-xs font-semibold tabular-nums text-accent-purple">
                {item.readinessScore}/100
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={`/compare-goals/${item.xrayId}`}
                className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent ft-focus-ring"
              >
                Compare with active goal
              </Link>
              <Link
                to={`/xray/${item.scanId}`}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white ft-focus-ring"
              >
                View X-Ray
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActiveGoalHeroCard({
  goal,
  timeEstimate,
  currentWeek,
  dueDate,
  weeklyImpactLow,
  weeklyImpactHigh,
}: {
  goal: CareerGoal;
  timeEstimate: { low: number; high: number };
  currentWeek?: number;
  dueDate?: string;
  weeklyImpactLow: number;
  weeklyImpactHigh: number;
}) {
  return (
    <section className="rounded-2xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/12 via-navy-card to-navy-card p-4">
      <span className="inline-block rounded-full bg-accent-purple/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-purple">
        Active goal
      </span>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-snug text-white">{goal.targetRole}</h2>
          <p className="mt-1 text-sm text-muted">From {goal.currentRole}</p>
        </div>
        <ScoreCircle
          score={goal.readinessScore}
          size={72}
          suffix="/100"
          label="Readiness"
          className="shrink-0"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px]">
          <span className="text-muted">Progress to goal</span>
          <span className="font-semibold tabular-nums text-white">{goal.readinessScore}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold"
            style={{ width: `${goal.readinessScore}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill icon={<ClockIcon />} label="Est. time" value={`${timeEstimate.low} – ${timeEstimate.high} mo`} />
        <MetricPill icon={<TrendIcon />} label="Next milestone" value={currentWeek ? `Week ${currentWeek}` : "—"} />
        <MetricPill icon={<CalendarIcon />} label="Due date" value={dueDate ? formatShortDate(dueDate) : "—"} />
        <MetricPill
          icon={<ZapIcon />}
          label="Weekly impact"
          value={`+${weeklyImpactLow} to +${weeklyImpactHigh} pts`}
        />
      </div>
    </section>
  );
}

function MetricPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/[0.03] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-accent-purple">{icon}</div>
      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-[11px] font-semibold leading-snug text-white">{value}</p>
    </div>
  );
}

function QuickActionsGrid({
  goalId,
  scanTo,
  latestScanId,
}: {
  goalId: string;
  scanTo: string;
  latestScanId?: string;
}) {
  const actions = [
    {
      title: "Free Scan",
      desc: "Analyze your current role.",
      to: scanTo,
      badge: "Free",
      badgeTone: "bg-accent/20 text-accent",
      icon: <ScanIcon />,
    },
    {
      title: "Career X-Ray",
      desc: "Deep dive into your transition.",
      to: latestScanId ? `/xray/${latestScanId}` : "/xray-history",
      icon: <TargetIcon />,
    },
    {
      title: "AI Career Transition",
      desc: "Track milestones & progress.",
      to: "/transition",
      icon: <FlagIcon />,
    },
    {
      title: "Transition Plan",
      desc: "View your full roadmap.",
      to: `/transition/plan/${goalId}`,
      icon: <PlanIcon />,
    },
    {
      title: "Milestones",
      desc: "See your weekly progress.",
      to: `/transition/plan/${goalId}`,
      icon: <ChartIcon />,
    },
    {
      title: "Profile",
      desc: "Manage your profile & goals.",
      to: "/profile",
      icon: <ProfileIcon />,
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">Quick actions</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="rounded-xl border border-white/8 bg-navy-card p-3 transition hover:border-accent-purple/30 ft-focus-ring"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-accent-purple">{action.icon}</span>
              {action.badge ? (
                <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-bold uppercase", action.badgeTone)}>
                  {action.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs font-bold text-white">{action.title}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted">{action.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ThisWeekSection({
  goal,
  milestone,
  completedTasks,
  totalTasks,
}: {
  goal: CareerGoal;
  milestone: WeeklyMilestoneWithTasks;
  completedTasks: number;
  totalTasks: number;
}) {
  const statusLabel =
    milestone.status === "in_progress"
      ? "In progress"
      : milestone.status === "completed"
        ? "Completed"
        : milestone.status === "missed"
          ? "Missed"
          : "Upcoming";

  const statusTone =
    milestone.status === "in_progress"
      ? "bg-accent/20 text-accent"
      : milestone.status === "completed"
        ? "bg-success/20 text-success"
        : milestone.status === "missed"
          ? "bg-danger/20 text-danger"
          : "bg-white/10 text-muted";

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">This week</h2>
        <span className="text-[10px] font-medium text-accent-purple">
          Week {milestone.weekNumber} of {goal.planLengthWeeks}
        </span>
      </div>

      <div className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-purple/15 text-accent-purple">
            <RocketIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white">{milestone.title}</h3>
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", statusTone)}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{milestone.description}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Progress</span>
            <span className="font-semibold tabular-nums text-white">{milestone.completionPercentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold transition-all"
              style={{ width: `${milestone.completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-lg border border-white/6 bg-white/[0.02] px-2 py-2">
            <p className="text-muted">Est. effort</p>
            <p className="mt-0.5 font-semibold text-white">{milestone.estimatedHours} hrs</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-white/[0.02] px-2 py-2">
            <p className="text-muted">Tasks</p>
            <p className="mt-0.5 font-semibold text-white">
              {completedTasks} / {totalTasks}
            </p>
          </div>
          <div className="rounded-lg border border-white/6 bg-white/[0.02] px-2 py-2">
            <p className="text-muted">Due date</p>
            <p className="mt-0.5 font-semibold text-white">{formatShortDate(milestone.dueDate)}</p>
          </div>
        </div>

        <PrimaryButtonLink
          to={`/transition/week/${milestone.id}`}
          fullWidth
          className="mt-4 bg-gradient-to-r from-accent-purple to-accent-gold"
        >
          Continue
        </PrimaryButtonLink>
      </div>
    </section>
  );
}

function estimateTimeToGoal(
  goal: CareerGoal,
  milestones: WeeklyMilestone[],
  current: WeeklyMilestoneWithTasks | null
): { low: number; high: number } {
  const completed = milestones.filter((m) => m.status === "completed").length;
  const remainingWeeks = Math.max(1, goal.planLengthWeeks - completed);
  const low = Math.max(1, Math.round(remainingWeeks / 5));
  const high = Math.max(low + 1, Math.round(remainingWeeks / 3));
  if (!current) return { low: 0, high: 0 };
  return { low, high };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14l4-4 4 4 8-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4v16M5 4h12l-3 4 3 4H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h4" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h16M6 16l3-8 3 5 3-9 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" strokeLinecap="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2c0 4-2 6-4 8v4l4 2 4-2v-4c-2-2-4-4-4-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
