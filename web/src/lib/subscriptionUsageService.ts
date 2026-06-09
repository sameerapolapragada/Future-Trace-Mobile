import { supabase } from "./supabaseClient";
import { FREE_SCANS_PER_WEEK } from "./subscriptionLimits";

export const TRANSITION_SCANS_PER_MONTH = 10;
export const TRANSITION_XRAYS_PER_MONTH = 10;
export const TRANSITION_GOAL_SWITCHES_PER_MONTH = 3;

export const TRANSITION_PRODUCT_KEY = "ai_career_transition_monthly";
export const EXTRA_XRAY_PRODUCT_KEY = "career_xray_extra";

export type TransitionSubscription = {
  subscriptionId: string | null;
  productKey: string;
  periodStart: string;
  periodEnd: string;
};

export type MonthlyUsage = {
  careerScansUsed: number;
  careerScansLimit: number;
  careerXraysUsed: number;
  careerXraysLimit: number;
  goalSwitchesUsed: number;
  goalSwitchesLimit: number;
  cycleResetDate: string;
};

type UsageRow = {
  career_scans_used: number;
  career_xrays_used: number;
  goal_switches_used: number;
  month_end: string;
};

type SubscriptionRpcRow = {
  subscription_id: string | null;
  product_key: string;
  period_start: string;
  period_end: string;
};

/** Active AI Career Transition subscription with valid billing period. */
export async function getActiveTransitionSubscription(
  userId: string
): Promise<TransitionSubscription | null> {
  const { data, error } = await supabase.rpc("get_active_transition_subscription", {
    p_user_id: userId,
  });

  if (error) {
    return fallbackTransitionSubscription(userId);
  }

  const row = (Array.isArray(data) ? data[0] : data) as SubscriptionRpcRow | undefined;
  if (!row?.period_end) return null;

  return {
    subscriptionId: row.subscription_id,
    productKey: row.product_key,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

async function fallbackTransitionSubscription(userId: string): Promise<TransitionSubscription | null> {
  const { data: row } = await supabase
    .from("user_entitlements")
    .select("has_radar, subscription_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row?.has_radar) return null;

  const periodEnd = row.subscription_expires_at;
  if (!periodEnd || new Date(periodEnd) <= new Date()) return null;

  const end = new Date(periodEnd);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);

  return {
    subscriptionId: null,
    productKey: TRANSITION_PRODUCT_KEY,
    periodStart: start.toISOString(),
    periodEnd: periodEnd,
  };
}

export async function isTransitionSubscriber(userId: string): Promise<boolean> {
  return (await getActiveTransitionSubscription(userId)) !== null;
}

function mapUsageRow(row: UsageRow): MonthlyUsage {
  return {
    careerScansUsed: row.career_scans_used,
    careerScansLimit: TRANSITION_SCANS_PER_MONTH,
    careerXraysUsed: row.career_xrays_used,
    careerXraysLimit: TRANSITION_XRAYS_PER_MONTH,
    goalSwitchesUsed: row.goal_switches_used,
    goalSwitchesLimit: TRANSITION_GOAL_SWITCHES_PER_MONTH,
    cycleResetDate: row.month_end,
  };
}

/** Monthly usage for the current billing cycle (subscribers only). */
export async function getMonthlyUsage(userId: string): Promise<MonthlyUsage | null> {
  const sub = await getActiveTransitionSubscription(userId);
  if (!sub) return null;

  const { data, error } = await supabase.rpc("get_or_create_monthly_usage", {
    p_user_id: userId,
  });

  if (error || !data) {
    const { data: row } = await supabase
      .from("subscription_usage")
      .select("career_scans_used, career_xrays_used, goal_switches_used, month_end")
      .eq("user_id", userId)
      .gte("month_end", new Date().toISOString())
      .order("month_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) {
      return {
        careerScansUsed: 0,
        careerScansLimit: TRANSITION_SCANS_PER_MONTH,
        careerXraysUsed: 0,
        careerXraysLimit: TRANSITION_XRAYS_PER_MONTH,
        goalSwitchesUsed: 0,
        goalSwitchesLimit: TRANSITION_GOAL_SWITCHES_PER_MONTH,
        cycleResetDate: sub.periodEnd,
      };
    }

    return mapUsageRow(row as UsageRow);
  }

  const usage = (Array.isArray(data) ? data[0] : data) as UsageRow;
  return mapUsageRow(usage);
}

async function hasOneTimeXrayForScan(userId: string, scanId: string): Promise<boolean> {
  const { data } = await supabase
    .from("career_xrays")
    .select("status, access_type")
    .eq("user_id", userId)
    .eq("scan_id", scanId)
    .maybeSingle();

  if (!data) return false;
  return (
    (data.status === "paid" || data.status === "generated") &&
    data.access_type === "one_time_purchase"
  );
}

const FREE_SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function getFreeWeeklyScanCount(userId: string): Promise<number> {
  const end = new Date();
  const start = new Date(end.getTime() - FREE_SCAN_WINDOW_MS);

  const { data: limitRow } = await supabase
    .from("usage_limits")
    .select("count")
    .eq("user_id", userId)
    .eq("action_type", "free_scan")
    .gte("window_end", start.toISOString())
    .lte("window_start", end.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (limitRow) return limitRow.count;

  const { count } = await supabase
    .from("career_scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  return count ?? 0;
}

export async function canRunCareerScan(userId: string): Promise<boolean> {
  const usage = await getMonthlyUsage(userId);
  if (usage) return usage.careerScansUsed < usage.careerScansLimit;

  const used = await getFreeWeeklyScanCount(userId);
  return used < FREE_SCANS_PER_WEEK;
}

export async function canGenerateCareerXray(userId: string, scanId: string): Promise<boolean> {
  if (await hasOneTimeXrayForScan(userId, scanId)) return true;

  const usage = await getMonthlyUsage(userId);
  if (usage) return usage.careerXraysUsed < usage.careerXraysLimit;

  return false;
}

export async function canSwitchGoal(userId: string): Promise<boolean> {
  const usage = await getMonthlyUsage(userId);
  if (!usage) return false;
  return usage.goalSwitchesUsed < usage.goalSwitchesLimit;
}

export async function incrementCareerScanUsage(userId: string): Promise<void> {
  const sub = await getActiveTransitionSubscription(userId);
  if (!sub) return;

  try {
    await supabase.rpc("increment_subscription_usage", {
      p_user_id: userId,
      p_field: "career_scans_used",
    });
  } catch {
    // Non-fatal if migration not applied yet.
  }
}

export async function incrementCareerXrayUsage(userId: string): Promise<void> {
  const sub = await getActiveTransitionSubscription(userId);
  if (!sub) return;

  try {
    await supabase.rpc("increment_subscription_usage", {
      p_user_id: userId,
      p_field: "career_xrays_used",
    });
  } catch {
    // Non-fatal if migration not applied yet.
  }
}

export async function incrementGoalSwitchUsage(userId: string): Promise<void> {
  try {
    await supabase.rpc("increment_subscription_usage", {
      p_user_id: userId,
      p_field: "goal_switches_used",
    });
  } catch {
    // Non-fatal if migration not applied yet.
  }
}

export function formatCycleResetDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
