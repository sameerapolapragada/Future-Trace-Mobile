import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  countUnreadNotifications,
  fetchUserNotifications,
  processDueNotifications,
} from "./transition/notificationService";
import { MilestoneLockedError } from "./transition/milestoneAccess";
import {
  ensureActiveGoalFromLatestScan,
  fetchActiveGoal,
  fetchGoal,
  fetchMilestoneWithTasks,
  fetchMilestonesForGoal,
  getCurrentMilestone,
  overallProgress,
  refreshTransitionState,
} from "./transition/transitionService";
import {
  applyPlanUpdate,
  checkPlanUpdatesForGoal,
  dismissPlanUpdate,
  fetchPendingPlanUpdates,
} from "./transition/planUpdateService";
import type { CareerGoal, PlanUpdateRecommendation, TransitionNotification, WeeklyMilestone } from "../types/transition";

export function useTransitionDashboard() {
  const { userId } = useAuth();
  const [goal, setGoal] = useState<CareerGoal | null>(null);
  const [milestones, setMilestones] = useState<WeeklyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setGoal(null);
      setMilestones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await refreshTransitionState(userId);
      let active = await ensureActiveGoalFromLatestScan(userId);
      if (!active) active = await fetchActiveGoal(userId);
      setGoal(active);

      if (active) {
        const weeks = await fetchMilestonesForGoal(userId, active.id);
        setMilestones(weeks);
      } else {
        setMilestones([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transition plan");
      setGoal(null);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentMilestone = getCurrentMilestone(milestones);
  const progress = overallProgress(milestones);

  return { goal, milestones, currentMilestone, progress, loading, error, refresh };
}

export function useMilestoneDetail(milestoneId: string | undefined) {
  const { userId } = useAuth();
  const [milestone, setMilestone] = useState<Awaited<ReturnType<typeof fetchMilestoneWithTasks>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId || !milestoneId) {
      setMilestone(null);
      setLocked(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLocked(false);

    try {
      const row = await fetchMilestoneWithTasks(userId, milestoneId);
      setMilestone(row);
    } catch (err) {
      if (err instanceof MilestoneLockedError) {
        setLocked(true);
        setMilestone(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load milestone");
        setMilestone(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, milestoneId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { milestone, loading, error, locked, refresh };
}

export function useTransitionPlan(goalId: string | undefined) {
  const { userId } = useAuth();
  const [goal, setGoal] = useState<CareerGoal | null>(null);
  const [milestones, setMilestones] = useState<WeeklyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !goalId) {
      setGoal(null);
      setMilestones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const g = await fetchGoal(userId, goalId);
      setGoal(g);
      if (g) {
        setMilestones(await fetchMilestonesForGoal(userId, goalId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [userId, goalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { goal, milestones, loading, error, refresh };
}

export function useNotifications() {
  const { userId } = useAuth();
  const [items, setItems] = useState<TransitionNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await processDueNotifications(userId);
      const [list, count] = await Promise.all([
        fetchUserNotifications(userId),
        countUnreadNotifications(userId),
      ]);
      setItems(list);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, unreadCount, loading, refresh };
}

export function usePlanUpdates(goalId: string | null | undefined) {
  const { userId } = useAuth();
  const [pending, setPending] = useState<PlanUpdateRecommendation[]>([]);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !goalId) {
      setPending([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setPending(await fetchPendingPlanUpdates(userId, goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan updates");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [userId, goalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runCheck = useCallback(async () => {
    if (!goalId) return 0;
    setChecking(true);
    setError(null);
    try {
      const created = await checkPlanUpdatesForGoal(goalId);
      await refresh();
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check for updates");
      return 0;
    } finally {
      setChecking(false);
    }
  }, [goalId, refresh]);

  const apply = useCallback(
    async (recommendationId: string) => {
      await applyPlanUpdate(recommendationId);
      await refresh();
    },
    [refresh]
  );

  const dismiss = useCallback(
    async (recommendationId: string) => {
      await dismissPlanUpdate(recommendationId);
      await refresh();
    },
    [refresh]
  );

  return { pending, loading, checking, error, refresh, runCheck, apply, dismiss };
}
