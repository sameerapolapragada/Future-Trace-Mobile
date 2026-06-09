import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../lib/ToastContext";
import { fetchCareerScan } from "../lib/scanService";
import {
  createGoalFromXray,
  fetchActiveGoal,
  fetchXrayById,
} from "../lib/transition/transitionService";
import { formatRoleName } from "../components/XRayReportSections";

export default function PostXrayPromptPage() {
  const { xrayId } = useParams<{ xrayId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGoalTarget, setActiveGoalTarget] = useState<string | null>(null);
  const [newTarget, setNewTarget] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [hasActiveGoal, setHasActiveGoal] = useState(false);

  useEffect(() => {
    if (!userId || !xrayId) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const [goal, xray] = await Promise.all([
          fetchActiveGoal(userId),
          fetchXrayById(userId, xrayId),
        ]);

        if (!xray || xray.status !== "generated") {
          setError("Career X-Ray not found");
          setLoading(false);
          return;
        }

        const scan = await fetchCareerScan(userId, xray.scanId);
        setScanId(xray.scanId);
        setNewTarget(
          formatRoleName(xray.result?.report?.targetRole ?? scan?.targetRole ?? "New role")
        );
        setHasActiveGoal(!!goal);
        setActiveGoalTarget(goal ? formatRoleName(goal.targetRole) : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, xrayId]);

  async function handleStartPlan() {
    if (!userId || !xrayId) return;
    setBusy(true);
    setError(null);
    try {
      await createGoalFromXray(userId, xrayId);
      navigate("/transition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start plan");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error && !newTarget) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link to="/home" className="text-sm text-accent">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!hasActiveGoal) {
    return (
      <div className="space-y-5 pb-6">
        <header className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">Analyze</p>
          <h1 className="mt-2 text-xl font-bold text-white">Your Career X-Ray is ready</h1>
          <p className="mt-2 text-sm text-muted">
            Explore complete. Ready to commit to a transition plan?
          </p>
        </header>

        <section className="rounded-2xl border border-accent-purple/30 bg-navy-card p-5 text-center">
          <p className="text-sm text-muted">Target role</p>
          <p className="mt-1 text-lg font-bold text-white">{newTarget}</p>
        </section>

        <PrimaryButton fullWidth disabled={busy} onClick={() => void handleStartPlan()}>
          {busy ? "Starting plan…" : "Start Transition Plan"}
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={() => navigate(scanId ? `/xray/${scanId}` : "/xray-history")}>
          View X-Ray Only
        </SecondaryButton>
        {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <header className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Explore</p>
        <h1 className="mt-2 text-xl font-bold text-white">You already have an active transition goal</h1>
      </header>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-5 space-y-4">
        <div className="rounded-xl border border-accent/25 bg-accent/8 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Current goal</p>
          <p className="mt-1 text-base font-bold text-white">{activeGoalTarget}</p>
        </div>
        <div className="rounded-xl border border-accent-purple/25 bg-accent-purple/8 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">New X-Ray</p>
          <p className="mt-1 text-base font-bold text-white">{newTarget}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Would you like to compare this X-Ray with your active goal?
        </p>
      </section>

      <PrimaryButton fullWidth onClick={() => navigate(`/compare-goals/${xrayId}`)}>
        Compare Goals
      </PrimaryButton>
      <SecondaryButton
        fullWidth
        onClick={() => {
          showToast("Your current goal is unchanged. This X-Ray was saved to your history.");
          navigate("/transition");
        }}
      >
        Keep Current Goal
      </SecondaryButton>
      <SecondaryButton
        fullWidth
        onClick={() => navigate(scanId ? `/xray/${scanId}` : "/xray-history")}
      >
        View New X-Ray Only
      </SecondaryButton>

      <Link
        to={scanId ? `/transition-paths/${scanId}` : "/xray-history"}
        className="block text-center text-sm text-accent-purple"
      >
        View Transition Paths
      </Link>
    </div>
  );
}
