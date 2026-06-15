import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PrimaryButton } from "../design-system";
import { useToast } from "../lib/ToastContext";
import {
  applyPlanUpdate,
  dismissPlanUpdate,
  fetchPlanUpdateDetail,
} from "../lib/transition/planUpdateService";
import { formatExpectedImpact, formatRecommendedUpdate } from "../lib/transition/planUpdateUi";
import { cn } from "../lib/cn";
import type { PlanUpdateRecommendation } from "../types/transition";

export default function PlanUpdateDetailPage() {
  const { recommendationId } = useParams<{ recommendationId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rec, setRec] = useState<PlanUpdateRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !recommendationId) {
      setRec(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const row = await fetchPlanUpdateDetail(userId, recommendationId);
      if (!row || row.status !== "pending") {
        setRec(row);
        if (!row) setError("AI transition plan update not found");
        else if (row.status === "applied") setError("This update was already applied.");
        else if (row.status === "dismissed") setError("This update was dismissed.");
        else setError("This update is no longer available.");
      } else {
        setRec(row);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI transition plan update");
      setRec(null);
    } finally {
      setLoading(false);
    }
  }, [userId, recommendationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApply() {
    if (!rec || rec.status !== "pending") return;
    setBusy(true);
    try {
      await applyPlanUpdate(rec.id);
      showToast("Your transition plan was updated.");
      navigate("/transition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply update");
    } finally {
      setBusy(false);
    }
  }

  async function handleDismiss() {
    if (!rec || rec.status !== "pending") return;
    setBusy(true);
    try {
      await dismissPlanUpdate(rec.id);
      showToast("AI transition plan update dismissed. Your current plan is unchanged.");
      navigate("/transition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not dismiss update");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error || !rec) {
    return (
      <div className="space-y-4 pb-6">
        <DetailHeader onBack={() => navigate("/transition")} />
        <p className="text-sm text-danger">{error ?? "AI transition plan update not found"}</p>
        <PrimaryButton fullWidth onClick={() => navigate("/transition")}>
          Back to Plan
        </PrimaryButton>
      </div>
    );
  }

  const tasks = rec.proposedChanges.add_tasks ?? [];
  const isLockedTarget = rec.targetIsUnlocked === false;

  return (
    <div className="space-y-4 pb-6">
      <DetailHeader onBack={() => navigate("/transition")} />

      <section className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-accent-purple/5 to-navy-card p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Recommended update</p>
        <h1 className="mt-2 text-xl font-bold text-white">{rec.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{rec.summary}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Market signal detected</p>
        <p className="mt-2 text-sm font-semibold text-white">{rec.signalSkillName ?? "Emerging skill"}</p>
        {rec.signalSummary ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{rec.signalSummary}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Why it matters</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{rec.whyItMatters}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Recommended change</p>
        <p className="mt-2 text-sm font-medium text-white">{formatRecommendedUpdate(rec)}</p>
        <p className="mt-1 text-xs text-muted">Apply to future milestones only — completed weeks stay unchanged.</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Affected milestone</p>
        {isLockedTarget ? (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium text-white">
              Month {rec.targetMonthNumber ?? "—"}
              {rec.targetWeekNumber ? ` · Week ${rec.targetWeekNumber}` : ""}
            </p>
            {rec.targetPreviewTitle ? (
              <p className="text-xs text-muted">{rec.targetPreviewTitle} (preview)</p>
            ) : null}
            <p className="text-xs text-muted">
              Full milestone details unlock when this month opens. Only proposed additions are shown below.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium text-white">
            {rec.targetMonthNumber ? `Month ${rec.targetMonthNumber}` : "Future milestone"}
            {rec.targetWeekNumber ? ` · Week ${rec.targetWeekNumber}` : ""}
          </p>
        )}
      </section>

      {tasks.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Proposed new tasks</p>
          <ul className="mt-3 divide-y divide-white/8">
            {tasks.map((task, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  {task.description ? (
                    <p className="mt-0.5 text-xs text-muted">{task.description}</p>
                  ) : null}
                </div>
                {task.estimated_minutes ? (
                  <span className="shrink-0 text-xs text-muted">{task.estimated_minutes} min</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-success/25 bg-success/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-success">Expected impact</p>
        <p className="mt-2 text-sm font-semibold text-success">
          {formatExpectedImpact(rec.expectedImpact)}
        </p>
      </section>

      {rec.status === "pending" ? (
        <div className="space-y-3">
          <PrimaryButton fullWidth disabled={busy} onClick={() => void handleApply()}>
            Apply Update
          </PrimaryButton>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDismiss()}
            className={cn(
              "w-full rounded-xl border border-white/12 py-3 text-sm font-medium text-muted transition",
              "hover:border-white/20 hover:text-white ft-focus-ring disabled:opacity-50"
            )}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => navigate("/transition")}
            className="w-full py-2 text-center text-sm text-accent transition hover:text-accent-soft ft-focus-ring"
          >
            Back to Plan
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DetailHeader({ onBack }: { onBack: () => void }) {
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
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">AI Transition Plan Update</h1>
        <div className="h-9 w-9" aria-hidden />
      </div>
    </header>
  );
}
