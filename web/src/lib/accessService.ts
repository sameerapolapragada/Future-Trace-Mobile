import { supabase } from "./supabaseClient";
import { FREE_SCANS_PER_WEEK } from "./subscriptionLimits";
import {
  canGenerateCareerXray,
  canRunCareerScan,
  getMonthlyUsage,
  incrementCareerScanUsage,
  isTransitionSubscriber,
  type MonthlyUsage,
} from "./subscriptionUsageService";
import type { CareerXrayRecord } from "../types";

export { FREE_SCANS_PER_WEEK };

const FREE_SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyScanStatus = {
  limit: number | null;
  used: number;
  remaining: number | null;
};

function currentWeekWindow(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - FREE_SCAN_WINDOW_MS);
  return { start, end };
}

/** @deprecated Use isTransitionSubscriber — kept for existing imports. */
export async function isRadarSubscriber(userId: string): Promise<boolean> {
  return isTransitionSubscriber(userId);
}

async function getFreeScanUsageCount(userId: string): Promise<number> {
  const { start, end } = currentWeekWindow();

  const { data: limitRow, error: limitError } = await supabase
    .from("usage_limits")
    .select("count")
    .eq("user_id", userId)
    .eq("action_type", "free_scan")
    .gte("window_end", start.toISOString())
    .lte("window_start", end.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!limitError && limitRow) return limitRow.count;

  const { count, error: scanCountError } = await supabase
    .from("career_scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if (scanCountError) return 0;
  return count ?? 0;
}

/** Subscriber: monthly limit. Free: 1 scan per 7-day window. */
export async function getWeeklyScanStatus(userId: string): Promise<WeeklyScanStatus> {
  const monthly = await getMonthlyUsage(userId);
  if (monthly) {
    const remaining = Math.max(0, monthly.careerScansLimit - monthly.careerScansUsed);
    return {
      limit: monthly.careerScansLimit,
      used: monthly.careerScansUsed,
      remaining,
    };
  }

  const used = await getFreeScanUsageCount(userId);
  const remaining = Math.max(0, FREE_SCANS_PER_WEEK - used);
  return { limit: FREE_SCANS_PER_WEEK, used, remaining };
}

export async function canRunScan(userId: string): Promise<boolean> {
  return canRunCareerScan(userId);
}

export async function recordFreeScanUsage(userId: string): Promise<void> {
  const isSub = await isTransitionSubscriber(userId);
  if (isSub) {
    await incrementCareerScanUsage(userId);
    return;
  }

  const { start, end } = currentWeekWindow();
  const windowStart = start.toISOString();
  const windowEnd = end.toISOString();

  const { data: existing } = await supabase
    .from("usage_limits")
    .select("id, count")
    .eq("user_id", userId)
    .eq("action_type", "free_scan")
    .eq("window_start", windowStart)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_limits")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("usage_limits").insert({
    user_id: userId,
    action_type: "free_scan",
    window_start: windowStart,
    window_end: windowEnd,
    count: 1,
  });
}

async function fetchXrayForScan(userId: string, scanId: string): Promise<CareerXrayRecord | null> {
  const { data, error } = await supabase
    .from("career_xrays")
    .select("*")
    .eq("user_id", userId)
    .eq("scan_id", scanId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapXrayRow(data);
}

export function mapXrayRow(row: Record<string, unknown>): CareerXrayRecord {
  return {
    id: row.id as string,
    scanId: row.scan_id as string,
    userId: row.user_id as string,
    accessType: row.access_type as CareerXrayRecord["accessType"],
    status: row.status as CareerXrayRecord["status"],
    stripeCheckoutSessionId: (row.stripe_checkout_session_id as string | null) ?? null,
    stripePaymentIntentId: (row.stripe_payment_intent_id as string | null) ?? null,
    result: (row.xray_result_json as CareerXrayRecord["result"]) ?? null,
    generatedAt: (row.generated_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Subscriber with quota, one-time purchase, or already generated X-Ray for this scan. */
export async function canAccessXray(userId: string, scanId: string): Promise<boolean> {
  const xray = await fetchXrayForScan(userId, scanId);
  if (xray?.status === "generated") return true;
  if (xray?.status === "paid") return true;

  return canGenerateCareerXray(userId, scanId);
}

/** Show $1.99 unlock when no included quota and no paid X-Ray for this scan. */
export async function shouldShowBuyXray(userId: string, scanId: string): Promise<boolean> {
  const xray = await fetchXrayForScan(userId, scanId);
  if (xray?.status === "generated" || xray?.status === "paid") return false;

  const allowed = await canGenerateCareerXray(userId, scanId);
  return !allowed;
}

export async function fetchXrayByScanId(
  userId: string,
  scanId: string
): Promise<CareerXrayRecord | null> {
  return fetchXrayForScan(userId, scanId);
}

export async function fetchUserXrays(userId: string): Promise<CareerXrayRecord[]> {
  const { data, error } = await supabase
    .from("career_xrays")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapXrayRow);
}

export function xrayStatusLabel(
  xray: CareerXrayRecord | null,
  isSubscriber: boolean
): "Not Purchased" | "Purchased" | "Generated" | "Included in Plan" | "Pending Payment" | "Failed" {
  if (isSubscriber && xray?.status === "generated") return "Included in Plan";
  if (isSubscriber && !xray) return "Included in Plan";
  if (!xray) return "Not Purchased";
  if (xray.status === "pending_payment") return "Pending Payment";
  if (xray.status === "paid") return "Purchased";
  if (xray.status === "generated") return "Generated";
  if (xray.status === "failed") return "Failed";
  return "Not Purchased";
}

export type { MonthlyUsage };
