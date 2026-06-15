import { Link, useNavigate, useParams } from "react-router-dom";
import { getCurrentMilestone, overallProgress } from "../lib/transition/transitionService";
import {
  formatShortDate,
  milestoneSubtitle,
  timelineStatusBadge,
  timelineWeekStatus,
} from "../lib/transition/milestoneUi";
import { useTransitionPlan } from "../lib/useTransitionData";
import type { WeeklyMilestone } from "../types/transition";
import { cn } from "../lib/cn";

export default function TransitionPlanPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { goal, milestones, loading, error } = useTransitionPlan(goalId);
  const unlocked = milestones.filter((m) => m.isUnlocked && m.status !== "locked");
  const current = getCurrentMilestone(milestones);
  const progress = overallProgress(milestones);

  if (loading) {
    return (
      <div className="flex min-h-[50svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-gold" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="space-y-4">
        <PlanTopBar onBack={() => navigate("/transition")} />
        <p className="text-sm text-danger">{error ?? "Plan not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <PlanTopBar onBack={() => navigate("/transition")} />

      <PlanSummaryCard
        planLengthWeeks={goal.planLengthWeeks}
        targetRole={goal.targetRole}
        progress={progress}
        unlockedCount={unlocked.length}
        totalCount={milestones.length}
      />

      <MonthFocusBanner />

      <section aria-label="Weekly milestones">
        <ul className="relative space-y-0">
          {milestones.map((milestone, index) => (
            <TimelineWeekRow
              key={milestone.id}
              milestone={milestone}
              status={timelineWeekStatus(milestone, current?.id ?? null)}
              isFirst={index === 0}
              isLast={index === milestones.length - 1}
              prevStatus={
                index > 0
                  ? timelineWeekStatus(milestones[index - 1]!, current?.id ?? null)
                  : null
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function MonthFocusBanner() {
  return (
    <section className="rounded-xl border border-accent-gold/15 bg-navy-card/60 px-4 py-3">
      <p className="text-xs leading-relaxed text-muted">
        AI Career Transition reveals your plan one month at a time to keep your path focused and
        adaptive. Your next milestone set unlocks after you complete 75% of this month or when the
        next month begins.
      </p>
    </section>
  );
}

function PlanTopBar({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 -mx-5 border-b border-white/6 bg-navy/95 px-5 pb-3 pt-1 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/8 ft-focus-ring"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Full Transition Plan</h1>
        <div className="h-9 w-9" aria-hidden />
      </div>
    </header>
  );
}

function PlanSummaryCard({
  planLengthWeeks,
  targetRole,
  progress,
  unlockedCount,
  totalCount,
}: {
  planLengthWeeks: number;
  targetRole: string;
  progress: number;
  unlockedCount: number;
  totalCount: number;
}) {
  return (
    <section className="rounded-2xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/12 via-navy-card to-navy-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gold/20 text-accent-gold">
          <FlagIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Your plan: {planLengthWeeks}-week transition</p>
          <h2 className="mt-0.5 text-lg font-bold text-white">{targetRole}</h2>
          <p className="mt-1 text-[10px] text-muted">
            {unlockedCount} of {totalCount} weeks unlocked
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-accent-gold">{progress}%</span>
      </div>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted">Progress on unlocked weeks</p>
      </div>
    </section>
  );
}

function TimelineWeekRow({
  milestone,
  status,
  isFirst,
  isLast,
  prevStatus,
}: {
  milestone: WeeklyMilestone;
  status: ReturnType<typeof timelineWeekStatus>;
  isFirst: boolean;
  isLast: boolean;
  prevStatus: ReturnType<typeof timelineWeekStatus> | null;
}) {
  const badge = timelineStatusBadge(status);
  const isLocked = status === "locked";
  const lineAboveTone =
    prevStatus === "completed" ? "bg-success" : prevStatus === "locked" ? "bg-white/10" : "bg-white/15";
  const lineBelowTone = status === "completed" ? "bg-success" : status === "locked" ? "bg-white/10" : "bg-white/15";

  const cardClass = cn(
    "mb-3 min-w-0 flex-1 rounded-2xl border p-4 transition",
    isLocked
      ? "border-white/6 bg-white/[0.02] opacity-80"
      : status === "in_progress"
        ? "border-accent-purple/35 bg-accent-purple/8 shadow-lg shadow-accent-purple/5 ft-focus-ring"
        : status === "completed"
          ? "border-success/20 bg-success/5 ft-focus-ring"
          : "border-white/8 bg-navy-card/60 hover:border-white/15 ft-focus-ring"
  );

  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Week {milestone.weekNumber}
        </p>
        <h3 className="mt-1 text-sm font-bold text-white">
          {isLocked ? milestone.lockedPreviewTitle ?? milestone.title : milestone.title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {isLocked
            ? milestone.lockedPreviewDescription ?? "Locked until next month"
            : milestoneSubtitle(milestone.description)}
        </p>
        {isLocked && milestone.unlockDate ? (
          <p className="mt-2 text-[10px] text-muted">
            Unlocks: {formatShortDate(milestone.unlockDate.slice(0, 10))}
          </p>
        ) : null}
        {isLocked ? (
          <p className="mt-1 text-[10px] text-muted">
            Complete 75% of this month or wait until next month.
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
          badge.className
        )}
      >
        {status === "completed" ? <CheckIcon /> : null}
        {status === "locked" ? <LockIcon /> : null}
        {badge.label}
      </span>
    </div>
  );

  return (
    <li className="relative flex gap-4">
      <div className="flex w-6 shrink-0 flex-col items-center">
        {!isFirst ? <div className={cn("h-4 w-0.5", lineAboveTone)} /> : <div className="h-2" />}
        <TimelineNode status={status} />
        {!isLast ? <div className={cn("min-h-[2rem] w-0.5 flex-1", lineBelowTone)} /> : null}
      </div>

      {isLocked ? (
        <div className={cardClass}>{inner}</div>
      ) : (
        <Link to={`/transition/week/${milestone.id}`} className={cardClass}>
          {inner}
        </Link>
      )}
    </li>
  );
}

function TimelineNode({ status }: { status: ReturnType<typeof timelineWeekStatus> }) {
  if (status === "locked") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/15 bg-white/5 text-muted">
        <LockIcon />
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent-purple/30 blur-sm" />
        <span className="relative h-5 w-5 rounded-full border-2 border-accent-gold bg-accent-purple/20">
          <span className="absolute inset-1 rounded-full bg-accent-gold" />
        </span>
      </span>
    );
  }
  if (status === "missed") {
    return <span className="h-5 w-5 rounded-full border-2 border-accent-gold bg-accent-gold/20" />;
  }
  return <span className="h-5 w-5 rounded-full border-2 border-white/20 bg-transparent" />;
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4v16M5 4h12l-3 4 3 4H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
    </svg>
  );
}
