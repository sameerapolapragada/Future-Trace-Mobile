import { supabase } from "./supabaseClient";
import { fetchUserEntitlements } from "./entitlementsService";
import type { CareerXrayRecord } from "../types";

const FREE_SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function currentWeekWindow(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - FREE_SCAN_WINDOW_MS);
  return { start, end };
}

/** Active AI Career Radar subscriber with valid period. */
export async function isRadarSubscriber(userId: string): Promise<boolean> {
  const entitlements = await fetchUserEntitlements(userId);
  if (!entitlements.hasRadar) return false;

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("product_key", "ai_career_radar_monthly")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subError && sub?.current_period_end) {
    return new Date(sub.current_period_end) > new Date();
  }

  return entitlements.hasRadar;
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

/** Radar: unlimited. Free: 1 scan per 7-day window. */
export async function canRunScan(userId: string): Promise<boolean> {
  if (await isRadarSubscriber(userId)) return true;
  const used = await getFreeScanUsageCount(userId);
  return used < 1;
}

export async function recordFreeScanUsage(userId: string): Promise<void> {
  if (await isRadarSubscriber(userId)) return;

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

/** Radar subscriber OR paid/generated X-Ray for this scan. */
export async function canAccessXray(userId: string, scanId: string): Promise<boolean> {
  if (await isRadarSubscriber(userId)) return true;

  const xray = await fetchXrayForScan(userId, scanId);
  if (!xray) return false;
  return xray.status === "paid" || xray.status === "generated";
}

/** Show $1.99 unlock when not Radar and no generated X-Ray yet. */
export async function shouldShowBuyXray(userId: string, scanId: string): Promise<boolean> {
  if (await isRadarSubscriber(userId)) return false;

  const xray = await fetchXrayForScan(userId, scanId);
  if (!xray) return true;
  return xray.status !== "generated";
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
  isRadar: boolean
): "Not Purchased" | "Purchased" | "Generated" | "Included in Radar" | "Pending Payment" | "Failed" {
  if (isRadar && xray?.status === "generated") return "Included in Radar";
  if (isRadar && !xray) return "Included in Radar";
  if (!xray) return "Not Purchased";
  if (xray.status === "pending_payment") return "Pending Payment";
  if (xray.status === "paid") return "Purchased";
  if (xray.status === "generated") return "Generated";
  if (xray.status === "failed") return "Failed";
  return "Not Purchased";
}
