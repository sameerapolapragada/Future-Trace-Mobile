import { Link, useNavigate } from "react-router-dom";
import { ReadinessScoreCard } from "../components/ReadinessScoreCard";
import { formatRoleName } from "../components/XRayReportSections";
import { PrimaryButtonLink } from "../design-system";
import { useToast } from "../lib/ToastContext";
import { formatExpectedImpact, formatRecommendedUpdate } from "../lib/transition/planUpdateUi";
import { usePlanUpdates, useTransitionDashboard } from "../lib/useTransitionData";
import type { CareerGoal, PlanUpdateRecommendation, WeeklyMilestone } from "../types/transition";
import { cn } from "../lib/cn";

export default function TransitionDashboardPage() {
  const { goal, milestones, currentMilestone, loading, error, refresh } = useTransitionDashboard();
  const planUpdates = usePlanUpdates(goal?.id);
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleApplyPlanUpdate(recommendationId: string) {
    try {
      await planUpdates.apply(recommendationId);
      showToast("Your transition plan was updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not apply update");
    }
  }

  async function handleDismissPlanUpdate(recommendationId: string) {
    try {
      await planUpdates.dismiss(recommendationId);
      showToast("AI transition plan update dismissed. Your current plan is unchanged.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not dismiss update");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pb-4">
        <DashboardHeader />
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 text-sm font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-6 pb-4">
        <DashboardHeader />
        <div className="rounded-2xl border border-white/8 bg-navy-card p-5 text-center">
          <h2 className="text-lg font-semibold text-white">Start your transition plan</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Run a Career Scan first so we can build weekly milestones from your current role to your
            target role.
          </p>
          <PrimaryButtonLink to="/scan" fullWidth className="mt-5">
            Run Career Scan
          </PrimaryButtonLink>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone(milestones, currentMilestone);
  const timeEstimate = estimateTimeToGoal(goal, milestones, currentMilestone);

  return (
    <div className="space-y-4 pb-6">
      <DashboardHeader />

      <ActiveGoalCard goal={goal} />

      <ReadinessScoreCard score={goal.readinessScore} />

      <PlanUpdatesSection
        pending={planUpdates.pending}
        loading={planUpdates.loading}
        checking={planUpdates.checking}
        error={planUpdates.error}
        onCheck={() => void planUpdates.runCheck()}
        onApply={(id) => void handleApplyPlanUpdate(id)}
        onDismiss={(id) => void handleDismissPlanUpdate(id)}
        onViewDetails={(id) => navigate(`/transition/plan-updates/${id}`)}
      />

      {currentMilestone ? (
        <CurrentWeekCard goal={goal} milestone={currentMilestone} />
      ) : (
        <section className="rounded-2xl border border-white/8 bg-navy-card p-4 text-center">
          <p className="text-sm text-muted">All milestones complete — great work on your transition.</p>
          <Link
            to={`/transition/plan/${goal.id}`}
            className="mt-3 inline-block text-sm font-medium text-accent transition hover:text-accent-soft"
          >
            View full plan
          </Link>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <NextMilestoneCard milestone={nextMilestone} />
        <TimeToGoalCard low={timeEstimate.low} high={timeEstimate.high} />
      </div>

      <BenefitsFooter />
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-white">AI Career Transition</h1>
        <span className="rounded bg-accent-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-gold">
          Pro
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Your weekly path from where you are to where you want to be.
      </p>
    </header>
  );
}

function ActiveGoalCard({ goal }: { goal: CareerGoal }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Your active goal</p>
        <Link
          to={`/transition/plan/${goal.id}`}
          className="text-[11px] font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
        >
          View plan
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <RolePill role={goal.currentRole} variant="current" />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-muted"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <RolePill role={goal.targetRole} variant="target" />
      </div>
    </section>
  );
}

function RolePill({ role, variant }: { role: string; variant: "current" | "target" }) {
  return (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          "mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg",
          variant === "current" ? "bg-accent/15 text-accent" : "bg-accent-purple/15 text-accent-purple"
        )}
      >
        {variant === "current" ? <BriefcaseIcon /> : <BrainIcon />}
      </div>
      <p className="text-xs font-semibold leading-snug text-white">{formatRoleName(role)}</p>
    </div>
  );
}

function PlanUpdatesSection({
  pending,
  loading,
  checking,
  error,
  onCheck,
  onApply,
  onDismiss,
  onViewDetails,
}: {
  pending: PlanUpdateRecommendation[];
  loading: boolean;
  checking: boolean;
  error: string | null;
  onCheck: () => void;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  const top = pending[0];

  return (
    <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">AI Transition Plan Updates</p>
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className="text-[11px] font-medium text-accent transition hover:text-accent-soft ft-focus-ring disabled:opacity-50"
        >
          {checking ? "Checking…" : "Check for updates"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-muted">Loading AI transition plan updates…</p>
      ) : top ? (
        <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/8 to-accent-purple/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">AI Transition Plan Update Available</p>

          <p className="mt-3 text-xs text-muted">New market signal detected:</p>
          <p className="text-sm font-semibold text-white">{top.signalSkillName ?? "Emerging skill"}</p>

          <p className="mt-3 text-xs text-muted">Recommended update:</p>
          <p className="text-sm text-white">{formatRecommendedUpdate(top)}</p>

          <p className="mt-3 text-xs text-muted">Why:</p>
          <p className="text-sm leading-relaxed text-muted">{top.whyItMatters}</p>

          <p className="mt-3 text-xs text-muted">Expected Impact:</p>
          <p className="text-sm font-semibold text-success">{formatExpectedImpact(top.expectedImpact)}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onApply(top.id)}
              className="rounded-lg bg-accent-purple px-2 py-2 text-[11px] font-semibold text-white transition hover:opacity-90 ft-focus-ring"
            >
              Apply Update
            </button>
            <button
              type="button"
              onClick={() => onDismiss(top.id)}
              className="rounded-lg border border-white/12 px-2 py-2 text-[11px] font-medium text-muted transition hover:border-white/20 hover:text-white ft-focus-ring"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={() => onViewDetails(top.id)}
              className="rounded-lg border border-accent/25 px-2 py-2 text-[11px] font-medium text-accent transition hover:border-accent/40 ft-focus-ring"
            >
              View Details
            </button>
          </div>

          {pending.length > 1 ? (
            <p className="mt-3 text-center text-[10px] text-muted">
              +{pending.length - 1} more recommended update{pending.length - 1 === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Your transition plan is up to date.</p>
      )}

      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </section>
  );
}

function CurrentWeekCard({ goal, milestone }: { goal: CareerGoal; milestone: WeeklyMilestone }) {
  return (
    <section className="rounded-2xl border border-accent-purple/35 bg-gradient-to-br from-accent-purple/8 to-navy-card p-4 shadow-lg shadow-accent-purple/5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white">Current week</p>
        <p className="text-[10px] font-semibold text-accent-purple">
          Due: {formatLongDate(milestone.dueDate)}
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">
        Week {milestone.weekNumber} of {goal.planLengthWeeks}
      </p>
      <h2 className="mt-1 text-lg font-bold leading-snug text-white">{milestone.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{milestone.description}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted">Progress</span>
          <span className="font-semibold tabular-nums text-white">{milestone.completionPercentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold transition-all duration-500"
            style={{ width: `${milestone.completionPercentage}%` }}
          />
        </div>
      </div>

      <PrimaryButtonLink
        to={`/transition/week/${milestone.id}`}
        fullWidth
        className="mt-4 bg-gradient-to-r from-accent-purple to-accent-gold shadow-accent-purple/25"
      >
        Continue Week {milestone.weekNumber}
      </PrimaryButtonLink>
    </section>
  );
}

function NextMilestoneCard({ milestone }: { milestone: WeeklyMilestone | null }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-navy-card p-3">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple">
        <CalendarIcon />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Next milestone</p>
      {milestone ? (
        <>
          <p className="mt-1 text-xs font-semibold leading-snug text-white">
            Week {milestone.weekNumber}: {milestone.title}
          </p>
          <p className="mt-1 text-[10px] text-muted">Starts {formatLongDate(milestone.startDate)}</p>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">You&apos;re on the final week — finish strong!</p>
      )}
    </section>
  );
}

function TimeToGoalCard({ low, high }: { low: number; high: number }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-navy-card p-3">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <ClockIcon />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Est. time to goal</p>
      <p className="mt-1 text-sm font-bold text-white">
        {low} – {high} months
      </p>
      <p className="mt-1 text-[10px] text-muted">Based on your current progress</p>
    </section>
  );
}

function BenefitsFooter() {
  const benefits = [
    { icon: <ScanIcon />, title: "10 Scans / Month", desc: "Track your progress monthly", tone: "text-success" },
    { icon: <XRayIcon />, title: "10 X-Rays / Month", desc: "Deep insights included", tone: "text-accent" },
    {
      icon: <MilestoneIcon />,
      title: "Weekly Milestones",
      desc: "Step-by-step plan to your goal",
      tone: "text-accent-gold",
    },
    {
      icon: <BellIcon />,
      title: "Smart Reminders",
      desc: "We keep you on track",
      tone: "text-success",
    },
  ];

  return (
    <section className="rounded-2xl border border-white/6 bg-navy-card/60 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {benefits.map((item) => (
          <div key={item.title} className="text-center">
            <div className={cn("mx-auto mb-1.5 flex h-8 w-8 items-center justify-center", item.tone)}>
              {item.icon}
            </div>
            <p className="text-[10px] font-semibold text-white">{item.title}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getNextMilestone(
  milestones: WeeklyMilestone[],
  current: WeeklyMilestone | null
): WeeklyMilestone | null {
  if (!current) return null;
  return milestones.find((m) => m.weekNumber === current.weekNumber + 1) ?? null;
}

function estimateTimeToGoal(
  goal: CareerGoal,
  milestones: WeeklyMilestone[],
  current: WeeklyMilestone | null
): { low: number; high: number } {
  const completed = milestones.filter((m) => m.status === "completed").length;
  const remainingWeeks = Math.max(1, goal.planLengthWeeks - completed);
  const low = Math.max(1, Math.round(remainingWeeks / 5));
  const high = Math.max(low + 1, Math.round(remainingWeeks / 3));
  if (!current) return { low: 0, high: 0 };
  return { low, high };
}

function formatLongDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3 3 3 0 0 0 3 3h1v2h6v-2h1a3 3 0 0 0 3-3 3 3 0 0 0-3-3V8a4 4 0 0 0-4-4z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
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

function XRayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

function MilestoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h16M6 16l3-8 3 5 3-9 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </svg>
  );
}
