import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "./entitlements";
import { fetchActiveGoal } from "./transition/transitionService";
import { fetchPastScans } from "./profileService";
import { useScanHistory } from "./useScanHistory";
import { countUnreadNotifications } from "./transition/notificationService";
import {
  fetchMilestonesForGoal,
  getCurrentMilestone,
} from "./transition/transitionService";
import type { CareerGoal } from "../types/transition";

export type SidebarNavItem = {
  id: string;
  label: string;
  to: string;
  badge?: { text: string; tone: "free" | "price" | "pro" | "count" };
  requiresAuth?: boolean;
};

export function useSidebarNav() {
  const { userId, isAuthenticated } = useAuth();
  const { entitlements } = useEntitlements();
  const { items: scanItems, loading: historyLoading } = useScanHistory();
  const [activeGoal, setActiveGoal] = useState<CareerGoal | null>(null);
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const hasXrays = scanItems.some(
    (item) => item.xray && (item.xray.status === "paid" || item.xray.status === "generated")
  );
  const latestScanId = scanItems[0]?.id;
  const latestXrayScanId =
    scanItems.find((item) => item.xray?.status === "generated")?.id ?? latestScanId;

  const refresh = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setActiveGoal(null);
      setCurrentMilestoneId(null);
      setScanCount(0);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [scans, goal] = await Promise.all([
        fetchPastScans(userId),
        fetchActiveGoal(userId),
      ]);
      setScanCount(scans.length);
      setActiveGoal(goal);

      if (goal) {
        const milestones = await fetchMilestonesForGoal(userId, goal.id);
        const current = getCurrentMilestone(milestones);
        setCurrentMilestoneId(current?.id ?? null);
      } else {
        setCurrentMilestoneId(null);
      }

      if (entitlements.hasRadar) {
        setUnreadCount(await countUnreadNotifications(userId));
      } else {
        setUnreadCount(0);
      }
    } catch {
      setActiveGoal(null);
      setCurrentMilestoneId(null);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, entitlements.hasRadar]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scanPath = (() => {
    if (!scanCount) return "/scan";
    if (entitlements.canRunScan) return "/scan";
    return latestScanId ? `/results/${latestScanId}` : "/home";
  })();

  const xrayPath = (() => {
    if (!scanCount) return "/scan";
    if (hasXrays) return "/xray-history";
    return latestScanId ? `/results/${latestScanId}` : "/xray-history";
  })();

  const transitionPath = entitlements.hasRadar ? "/transition" : "/upgrade?product=transition";

  const planPath = activeGoal
    ? `/transition/plan/${activeGoal.id}`
    : entitlements.hasRadar
      ? "/transition"
      : "/upgrade?product=transition";

  const milestonesPath = currentMilestoneId
    ? `/transition/week/${currentMilestoneId}`
    : planPath;

  const notificationsPath = entitlements.hasRadar ? "/notifications" : "/upgrade?product=transition";

  const items: SidebarNavItem[] = [
    { id: "dashboard", label: "Dashboard", to: "/home" },
    {
      id: "scan",
      label: "Career Scan",
      to: scanPath,
      badge: { text: "Free", tone: "free" },
    },
    {
      id: "xray",
      label: "Career X-Ray",
      to: xrayPath,
      badge: entitlements.hasRadar ? undefined : { text: "$1.99", tone: "price" },
    },
    {
      id: "transition",
      label: "AI Career Transition",
      to: transitionPath,
      badge: entitlements.hasRadar ? { text: "Pro", tone: "pro" } : { text: "$9.99", tone: "price" },
    },
    { id: "plan", label: "Transition Plan", to: planPath },
    { id: "milestones", label: "Milestones", to: milestonesPath },
    {
      id: "notifications",
      label: "Notifications",
      to: notificationsPath,
      badge: unreadCount > 0 ? { text: String(unreadCount), tone: "count" } : undefined,
    },
    { id: "profile", label: "Profile", to: "/profile" },
  ];

  return {
    items,
    scanPath,
    xrayPath,
    transitionPath,
    planPath,
    milestonesPath,
    activeGoal,
    scanCount,
    hasXrays,
    latestXrayScanId,
    unreadCount,
    loading: loading || historyLoading,
    refresh,
  };
}
