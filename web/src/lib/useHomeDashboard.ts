import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "./entitlements";
import {
  fetchActiveGoal,
  fetchExplorationXrays,
  fetchMilestoneWithTasks,
  fetchMilestonesForGoal,
  getCurrentMilestone,
  overallProgress,
  refreshTransitionState,
  type ExplorationXray,
} from "./transition/transitionService";
import { useProfileData } from "./useProfileData";
import { useScanHistory } from "./useScanHistory";
import type { SavedScanSummary } from "./profileService";
import type { CareerGoal, WeeklyMilestone, WeeklyMilestoneWithTasks } from "../types/transition";
import type { ScanHistoryItem } from "../types";

export type LatestScanSnapshot = {
  scanId: string;
  aiExposure: number;
  aiExposureLabel: string;
  resilience: number;
  resilienceLabel: string;
  automationRisk: number;
  automationRiskLabel: string;
  opportunity: string;
  opportunityLabel: string;
};

function labelFromScore(score: number, bands: [number, string][]): string {
  for (const [threshold, label] of bands) {
    if (score >= threshold) return label;
  }
  return bands[bands.length - 1]?.[1] ?? "—";
}

function buildSnapshot(
  latestScan: SavedScanSummary | undefined,
  latestItem: ScanHistoryItem | undefined
): LatestScanSnapshot | null {
  if (!latestScan && !latestItem) return null;

  const current = latestItem?.freeResult?.currentRoleProfile;
  const target = latestItem?.freeResult?.targetRoleProfile;
  const resolvedExposure =
    latestScan?.aiExposureScore ??
    (current?.aiExposureLevel === "low" ? 35 : current?.aiExposureLevel === "high" ? 82 : 62);

  const resilience = latestScan?.resilienceScore ?? current?.resilienceScore ?? 58;
  const automationRisk = Math.round(resolvedExposure * 0.7);
  const targetResilience = target?.resilienceScore ?? resilience;
  const opportunity =
    targetResilience >= 70 ? "High" : targetResilience >= 50 ? "Moderate" : "Developing";

  return {
    scanId: latestScan?.id ?? latestItem!.id,
    aiExposure: resolvedExposure,
    aiExposureLabel: labelFromScore(resolvedExposure, [
      [70, "High"],
      [45, "Moderate"],
      [0, "Low"],
    ]),
    resilience,
    resilienceLabel: labelFromScore(resilience, [
      [70, "Strong"],
      [50, "Developing"],
      [0, "Emerging"],
    ]),
    automationRisk,
    automationRiskLabel: labelFromScore(automationRisk, [
      [60, "High"],
      [35, "Moderate"],
      [0, "Low"],
    ]),
    opportunity,
    opportunityLabel: opportunity === "High" ? "Strong Outlook" : opportunity === "Moderate" ? "Positive" : "Building",
  };
}

export function useHomeDashboard() {
  const { userId } = useAuth();
  const { entitlements } = useEntitlements();
  const { profile, scans, loading: profileLoading } = useProfileData();
  const { items, loading: historyLoading } = useScanHistory();
  const [activeGoal, setActiveGoal] = useState<CareerGoal | null>(null);
  const [milestones, setMilestones] = useState<WeeklyMilestone[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<WeeklyMilestoneWithTasks | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [explorationXrays, setExplorationXrays] = useState<ExplorationXray[]>([]);

  const refreshGoal = useCallback(async () => {
    if (!userId) {
      setActiveGoal(null);
      setGoalLoading(false);
      return;
    }
    setGoalLoading(true);
    try {
      setActiveGoal(await fetchActiveGoal(userId));
    } catch {
      setActiveGoal(null);
    } finally {
      setGoalLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshGoal();
  }, [refreshGoal]);

  useEffect(() => {
    if (!userId) {
      setExplorationXrays([]);
      return;
    }

    void fetchExplorationXrays(userId, activeGoal).then(setExplorationXrays).catch(() => setExplorationXrays([]));

    if (!activeGoal) {
      setMilestones([]);
      setCurrentMilestone(null);
      return;
    }

    const uid = userId;
    const goalId = activeGoal.id;
    let cancelled = false;

    async function loadTransition() {
      setTransitionLoading(true);
      try {
        await refreshTransitionState(uid);
        const weeks = await fetchMilestonesForGoal(uid, goalId);
        if (cancelled) return;
        setMilestones(weeks);
        const current = getCurrentMilestone(weeks);
        if (current) {
          const detail = await fetchMilestoneWithTasks(uid, current.id);
          if (!cancelled) setCurrentMilestone(detail);
        } else {
          setCurrentMilestone(null);
        }
      } catch {
        if (!cancelled) {
          setMilestones([]);
          setCurrentMilestone(null);
        }
      } finally {
        if (!cancelled) setTransitionLoading(false);
      }
    }

    void loadTransition();
    return () => {
      cancelled = true;
    };
  }, [userId, activeGoal]);

  const generatedXrays = items.filter(
    (item) => item.xray?.status === "generated" && item.xray.result
  );
  const hasPurchasedXrays = items.some(
    (item) => item.xray && (item.xray.status === "paid" || item.xray.status === "generated")
  );

  const showActiveGoalHome = !!activeGoal && !goalLoading && !transitionLoading;

  const showRichHome =
    !showActiveGoalHome && scans.length > 0 && hasPurchasedXrays && !goalLoading;

  const showScansOnlyHome =
    !showActiveGoalHome && scans.length > 0 && !hasPurchasedXrays && !goalLoading;

  const planProgress = overallProgress(milestones);
  const latestSnapshot = buildSnapshot(scans[0], items[0]);
  const transitionCtaTo = entitlements.hasRadar ? "/transition" : "/upgrade?product=transition";

  return {
    profile,
    scans,
    generatedXrays,
    activeGoal,
    explorationXrays,
    milestones,
    currentMilestone,
    planProgress,
    latestSnapshot,
    showActiveGoalHome,
    showRichHome,
    showScansOnlyHome,
    transitionCtaTo,
    loading: profileLoading || historyLoading || goalLoading || transitionLoading,
  };
}
