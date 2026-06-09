import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../lib/ToastContext";
import {
  buildComparisonRows,
  buildRecommendation,
  metricsFromGoal,
  metricsFromXrayRecord,
} from "../lib/goalComparisonService";
import { fetchCareerScan } from "../lib/scanService";
import { canSwitchGoal } from "../lib/subscriptionUsageService";
import {
  createGoalFromXray,
  fetchActiveGoal,
  fetchXrayById,
  switchToGoalFromXray,
} from "../lib/transition/transitionService";
import { cn } from "../lib/cn";

export default function CompareGoalsPage() {
  const { newXrayId } = useParams<{ newXrayId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReturnType<typeof buildComparisonRows>>([]);
  const [recommendation, setRecommendation] = useState("");
  const [currentTarget, setCurrentTarget] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);
  const [hasActiveGoal, setHasActiveGoal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [switchBlocked, setSwitchBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !newXrayId) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const [goal, xray, canSwitch] = await Promise.all([
          fetchActiveGoal(userId),
          fetchXrayById(userId, newXrayId),
          canSwitchGoal(userId),
        ]);

        if (!xray || xray.status !== "generated") {
          setError("Career X-Ray not found");
          setLoading(false);
          return;
        }

        const scan = await fetchCareerScan(userId, xray.scanId);
        if (!scan) {
          setError("Scan not found");
          setLoading(false);
          return;
        }

        setScanId(xray.scanId);
        setSwitchBlocked(!canSwitch);

        const nextMetrics = metricsFromXrayRecord(xray, scan.targetRole, scan.currentRole);
        setNewTarget(nextMetrics.targetRole);

        if (!goal) {
          setHasActiveGoal(false);
          setLoading(false);
          return;
        }

        setHasActiveGoal(true);
        const currentMetrics = metricsFromGoal(goal);
        setCurrentTarget(currentMetrics.targetRole);
        setRows(buildComparisonRows(currentMetrics, nextMetrics));
        setRecommendation(buildRecommendation(currentMetrics, nextMetrics));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load comparison");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, newXrayId]);

  async function handleStartPlan() {
    if (!userId || !newXrayId) return;
    setBusy(true);
    try {
      await createGoalFromXray(userId, newXrayId);
      navigate("/transition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start plan");
      setBusy(false);
    }
  }

  async function handleConfirmSwitch() {
    if (!userId || !newXrayId) return;
    setBusy(true);
    setError(null);
    try {
      await switchToGoalFromXray(userId, newXrayId);
      showToast("Your active goal has been updated.", "success");
      navigate("/transition");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Switch failed";
      if (msg.includes("limit")) {
        setSwitchBlocked(true);
        setShowConfirm(false);
      }
      setError(msg);
      setBusy(false);
    }
  }

  function handleKeepCurrent() {
    showToast("Your current goal is unchanged. This X-Ray was saved to your history.");
    navigate("/transition");
  }

  function handleSaveOnly() {
    showToast("Saved as career exploration.");
    navigate(scanId ? `/xray/${scanId}` : "/xray-history");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error && !hasActiveGoal && !newTarget) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!hasActiveGoal) {
    return (
      <div className="space-y-5 pb-6">
        <CompareHeader />
        <p className="text-sm text-muted">
          You don&apos;t have an active goal yet. Start a transition plan from this X-Ray.
        </p>
        <section className="rounded-2xl border border-accent-purple/30 bg-navy-card p-4 text-center">
          <p className="text-lg font-bold text-white">{newTarget}</p>
        </section>
        <PrimaryButton fullWidth disabled={busy} onClick={() => void handleStartPlan()}>
          Start Transition Plan
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={handleSaveOnly}>
          Save X-Ray Only
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <CompareHeader />

      <p className="text-sm leading-relaxed text-muted">
        Decide whether to continue your current path or switch to this new opportunity.
      </p>

      <div className="overflow-hidden rounded-2xl border border-white/8">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/8 bg-navy-card">
              <th className="px-3 py-3 font-bold uppercase tracking-wide text-muted">Metric</th>
              <th className="px-3 py-3 font-bold uppercase tracking-wide text-accent">Current Goal</th>
              <th className="px-3 py-3 font-bold uppercase tracking-wide text-accent-purple">New X-Ray</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-b border-white/6">
                <td className="px-3 py-3 font-medium text-muted">{row.metric}</td>
                <td className={cn("px-3 py-3 text-white", toneClass(row.tone, "current"))}>
                  {row.currentValue}
                </td>
                <td className={cn("px-3 py-3 text-white", toneClass(row.tone, "new"))}>
                  {row.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">Recommendation</p>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{recommendation}</p>
      </section>

      {switchBlocked ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          You&apos;ve used all 3 goal switches this month. Continue your current goal or wait until your
          next billing cycle.
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="space-y-2">
        <SecondaryButton fullWidth onClick={handleKeepCurrent}>
          Keep Current Goal
        </SecondaryButton>
        <PrimaryButton
          fullWidth
          disabled={switchBlocked || busy}
          onClick={() => setShowConfirm(true)}
          className="bg-accent-purple"
        >
          Switch to New Goal
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={handleSaveOnly}>
          Save X-Ray Only
        </SecondaryButton>
      </div>

      {showConfirm ? (
        <ConfirmSwitchModal
          currentTarget={currentTarget}
          newTarget={newTarget}
          busy={busy}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void handleConfirmSwitch()}
        />
      ) : null}
    </div>
  );
}

function CompareHeader() {
  const navigate = useNavigate();
  return (
    <header>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 text-sm text-muted hover:text-white"
      >
        ← Back
      </button>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white">Compare Career Goals</p>
      <h1 className="mt-1 text-xl font-bold text-white">Current path vs. new opportunity</h1>
    </header>
  );
}

function toneClass(tone: ReturnType<typeof buildComparisonRows>[0]["tone"], side: "current" | "new") {
  if (tone === "better-new" && side === "new") return "text-success font-semibold";
  if (tone === "better-current" && side === "current") return "text-success font-semibold";
  if (tone === "risk" && side === "new") return "text-accent-gold font-semibold";
  return "";
}

function ConfirmSwitchModal({
  currentTarget,
  newTarget,
  busy,
  onCancel,
  onConfirm,
}: {
  currentTarget: string;
  newTarget: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-card p-5">
        <h2 className="text-lg font-bold text-white">Switch active goal?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your progress toward <span className="text-accent">{currentTarget}</span> will be paused, not
          deleted. You can return to it later.
        </p>
        <p className="mt-2 text-sm text-white">
          New goal: <span className="text-accent-purple">{newTarget}</span>
        </p>
        <div className="mt-5 flex gap-2">
          <SecondaryButton fullWidth onClick={onCancel} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={onConfirm} disabled={busy} className="bg-accent-purple">
            {busy ? "Switching…" : "Confirm Switch"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
