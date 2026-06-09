import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MilestoneWatermark } from "../components/MilestoneWatermark";
import { useAuth } from "../auth/useAuth";
import { PrimaryButton } from "../design-system";
import { useMilestoneDetail } from "../lib/useTransitionData";
import {
  completeMilestone,
  completeTask,
  fetchGoal,
} from "../lib/transition/transitionService";
import {
  formatEstimatedEffort,
  formatMilestoneDueDate,
  milestoneWhyItMatters,
  weeklyReadinessMax,
  weeklyReadinessMin,
} from "../lib/transition/milestoneUi";
import { fetchMilestoneVersions } from "../lib/transition/planUpdateService";
import type { CareerGoal, MilestoneTask, MilestoneVersion } from "../types/transition";

function isTaskCompleted(task: MilestoneTask): boolean {
  return task.status === "completed";
}

function taskStatusLabel(
  completed: boolean,
  isInProgress: boolean,
): { label: string; className: string } {
  if (completed) return { label: "Completed", className: "text-success" };
  if (isInProgress) return { label: "In Progress", className: "text-accent-purple" };
  return { label: "Pending", className: "text-muted" };
}

export default function WeeklyMilestonePage() {
  const { userId } = useAuth();
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const navigate = useNavigate();
  const { milestone, loading, error, locked, refresh } = useMilestoneDetail(milestoneId);
  const [goal, setGoal] = useState<CareerGoal | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [versions, setVersions] = useState<MilestoneVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (!userId || !milestone?.goalId) {
      setGoal(null);
      return;
    }
    void fetchGoal(userId, milestone.goalId).then(setGoal).catch(() => setGoal(null));
  }, [userId, milestone?.goalId]);

  useEffect(() => {
    if (!milestoneId || !milestone?.adaptiveUpdateNote) {
      setVersions([]);
      return;
    }
    void fetchMilestoneVersions(milestoneId)
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [milestoneId, milestone?.adaptiveUpdateNote]);

  const firstIncompleteIndex = useMemo(() => {
    if (!milestone) return -1;
    return milestone.tasks.findIndex((t) => !isTaskCompleted(t));
  }, [milestone]);

  const handleToggleTask = useCallback(
    async (taskId: string, completed: boolean) => {
      if (!userId || !milestoneId || completed) return;
      setBusy(true);
      setActionError(null);
      try {
        await completeTask(userId, taskId);
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not update task");
      } finally {
        setBusy(false);
      }
    },
    [userId, milestoneId, refresh],
  );

  const handleCompleteWeek = useCallback(async () => {
    if (!userId || !milestoneId) return;
    setBusy(true);
    setActionError(null);
    try {
      await completeMilestone(userId, milestoneId);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not complete week");
    } finally {
      setBusy(false);
    }
  }, [userId, milestoneId, refresh]);

  if (loading) {
    return (
      <div className="flex min-h-[50svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="space-y-5 pb-6">
        <MilestoneTopBar onBack={() => navigate("/transition")} />
        <section className="rounded-2xl border border-white/8 bg-navy-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted">
            <LockIcon />
          </span>
          <h1 className="text-lg font-bold text-white">This milestone is locked</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Future milestones unlock one month at a time so your transition plan stays focused.
          </p>
          <p className="mt-2 text-xs text-muted">
            Your next milestone set unlocks after you complete 75% of this month or when the next month
            begins.
          </p>
          <PrimaryButton fullWidth className="mt-5" onClick={() => navigate("/transition")}>
            Return to Current Plan
          </PrimaryButton>
        </section>
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="space-y-4">
        <MilestoneTopBar onBack={() => navigate("/transition")} />
        <p className="text-sm text-danger">{error ?? "Milestone not found"}</p>
      </div>
    );
  }

  const planWeeks = goal?.planLengthWeeks ?? 12;
  const weekComplete = milestone.status === "completed";

  return (
    <div className="relative space-y-4 pb-6">
      <MilestoneWatermark />
      <MilestoneTopBar onBack={() => navigate("/transition")} />

      {/* Overview card */}
      <section className="rounded-2xl border border-white/8 bg-navy-card/80 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="rounded-full bg-accent-purple/25 px-3 py-1 text-xs font-semibold text-accent-purple">
            Week {milestone.weekNumber} of {planWeeks}
          </span>
          <span className="shrink-0 text-xs text-muted">
            Due: {formatMilestoneDueDate(milestone.dueDate)}
          </span>
        </div>

        <h1 className="text-xl font-bold text-white">{milestone.title}</h1>
        {milestone.description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{milestone.description}</p>
        ) : null}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatBox label="Estimated Effort" value={formatEstimatedEffort(milestone.estimatedHours)} />
          <StatBox
            label="Expected Outcome"
            value={milestone.expectedOutcome || "Complete this week's milestone tasks."}
          />
          <StatBox
            label="Impact on Readiness"
            value={`+${weeklyReadinessMin(milestone.weekNumber)} to +${weeklyReadinessMax(milestone.weekNumber)} points`}
          />
        </div>
      </section>

      {milestone.adaptiveUpdateNote ? (
        <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <button
            type="button"
            onClick={() => setShowVersionHistory((v) => !v)}
            className="w-full text-left ft-focus-ring"
          >
            <p className="text-xs font-medium text-accent">{milestone.adaptiveUpdateNote}</p>
            {versions.length > 0 ? (
              <p className="mt-1 text-[10px] text-muted">Tap to {showVersionHistory ? "hide" : "view"} change details</p>
            ) : null}
          </button>
          {showVersionHistory && versions[0] ? (
            <div className="mt-3 space-y-2 border-t border-white/8 pt-3 text-xs text-muted">
              <p>
                <span className="font-medium text-white">Reason:</span> {versions[0].changeReason}
              </p>
              <p className="font-medium text-white">Previous tasks</p>
              <TaskListFromVersion content={versions[0].previousContent} />
              <p className="font-medium text-white">Updated tasks</p>
              <TaskListFromVersion content={versions[0].newContent} />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Tasks card */}
      <section className="rounded-2xl border border-white/8 bg-navy-card/80 p-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted">Tasks</p>

        <ul className="divide-y divide-white/8">
          {milestone.tasks.map((task, index) => {
            const completed = isTaskCompleted(task);
            const isInProgress =
              !completed &&
              index === firstIncompleteIndex &&
              (milestone.status === "in_progress" || milestone.status === "not_started");
            const status = taskStatusLabel(completed, isInProgress);

            return (
              <li key={task.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  disabled={busy || completed || weekComplete}
                  onClick={() => void handleToggleTask(task.id, completed)}
                  className="mt-0.5 shrink-0 disabled:cursor-default ft-focus-ring"
                  aria-label={completed ? "Completed" : "Mark complete"}
                >
                  {completed ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                      <svg
                        className="h-4 w-4 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-purple" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{task.title}</p>
                  {task.description ? (
                    <p className="mt-0.5 text-sm text-muted">{task.description}</p>
                  ) : null}
                </div>

                <div className="shrink-0 text-right">
                  {task.estimatedMinutes ? (
                    <p className="text-xs text-muted">{task.estimatedMinutes} min</p>
                  ) : null}
                  <p className={`mt-1 text-xs font-medium ${status.className}`}>{status.label}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {actionError ? (
          <p className="mt-4 text-center text-sm text-danger">{actionError}</p>
        ) : null}

        {weekComplete ? (
          <div className="mt-5 rounded-xl bg-success/10 py-3 text-center text-sm font-medium text-success">
            Week completed
          </div>
        ) : (
          <PrimaryButton
            type="button"
            fullWidth
            disabled={busy}
            onClick={() => void handleCompleteWeek()}
            className="mt-5 bg-accent-purple shadow-accent-purple/25 hover:opacity-95"
          >
            Mark Week as Complete
          </PrimaryButton>
        )}
      </section>

      {/* Why this matters */}
      <section className="rounded-2xl border border-white/8 bg-navy-card/80 p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-accent-gold" aria-hidden>
            <LightningIcon />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">Why This Matters</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{milestoneWhyItMatters(milestone)}</p>
      </section>

      <button
        type="button"
        onClick={() => navigate(`/transition/plan/${milestone.goalId}`)}
        className="w-full text-center text-sm text-accent-purple transition hover:text-accent ft-focus-ring"
      >
        View full transition plan
      </button>
    </div>
  );
}

function MilestoneTopBar({ onBack }: { onBack: () => void }) {
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
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Weekly Milestone</h1>
        <div className="h-9 w-9" aria-hidden />
      </div>
    </header>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-navy/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xs font-medium leading-snug text-white">{value}</p>
    </div>
  );
}

function LightningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function TaskListFromVersion({ content }: { content: Record<string, unknown> }) {
  const tasks = content.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return <p className="text-muted">No tasks recorded</p>;
  }

  return (
    <ul className="list-inside list-disc space-y-1">
      {tasks.map((task, i) => {
        const t = task as Record<string, unknown>;
        return <li key={i}>{String(t.title ?? "Task")}</li>;
      })}
    </ul>
  );
}
