import { supabase } from "./supabaseClient";
import { getWeeklyScanStatus } from "./accessService";
import { FREE_SCANS_PER_WEEK, UPGRADE_WEEKLY_SCAN_PATH } from "./subscriptionLimits";
import { getMonthlyUsage } from "./subscriptionUsageService";
import type { Entitlements } from "../types";

type UserEntitlementsRow = {
  has_radar: boolean;
  subscription_expires_at: string | null;
};

const DEFAULT: Entitlements = {
  hasRadar: false,
  hasCompletedScan: false,
  canRunScan: true,
  scansRemainingThisWeek: FREE_SCANS_PER_WEEK,
  nextScanEligibleAt: null,
  daysUntilNextScan: null,
  subscriptionExpiresAt: null,
  monthlyUsage: null,
};

function mapRow(
  row: UserEntitlementsRow,
  hasCompletedScan: boolean,
  scanAllowed: boolean,
  scansRemainingThisWeek: number | null,
  nextScanEligibleAt: string | null,
  daysUntilNextScan: number | null,
  monthlyUsage: Entitlements["monthlyUsage"]
): Entitlements {
  const hasRadar =
    row.has_radar &&
    (!row.subscription_expires_at || new Date(row.subscription_expires_at) > new Date());

  return {
    hasRadar,
    hasCompletedScan,
    canRunScan: hasRadar ? scanAllowed : scanAllowed,
    scansRemainingThisWeek,
    nextScanEligibleAt,
    daysUntilNextScan,
    subscriptionExpiresAt: row.subscription_expires_at,
    monthlyUsage: hasRadar ? monthlyUsage : null,
  };
}

export async function fetchUserEntitlements(userId: string): Promise<Entitlements> {
  let scanAllowed = true;
  let scansRemainingThisWeek: number | null = FREE_SCANS_PER_WEEK;
  let nextScanEligibleAt: string | null = null;
  let daysUntilNextScan: number | null = null;
  let monthlyUsage: Entitlements["monthlyUsage"] = null;

  try {
    const [scanStatus, usage] = await Promise.all([
      getWeeklyScanStatus(userId),
      getMonthlyUsage(userId),
    ]);
    monthlyUsage = usage;
    scansRemainingThisWeek = scanStatus.remaining;
    nextScanEligibleAt = scanStatus.nextEligibleAt;
    daysUntilNextScan = scanStatus.daysUntilNextScan;
    scanAllowed = scanStatus.remaining === null ? true : scanStatus.remaining > 0;
  } catch {
    scanAllowed = true;
    scansRemainingThisWeek = FREE_SCANS_PER_WEEK;
  }

  const [entitlementsResult, scansResult] = await Promise.all([
    supabase
      .from("user_entitlements")
      .select("has_radar, subscription_expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("career_scans").select("id").eq("user_id", userId).limit(1),
  ]);

  if (entitlementsResult.error) throw entitlementsResult.error;
  if (scansResult.error) throw scansResult.error;

  const hasCompletedScan = (scansResult.data?.length ?? 0) > 0;

  if (!entitlementsResult.data) {
    return {
      ...DEFAULT,
      hasCompletedScan,
      canRunScan: scanAllowed,
      scansRemainingThisWeek,
      nextScanEligibleAt,
      daysUntilNextScan,
    };
  }

  return mapRow(
    entitlementsResult.data,
    hasCompletedScan,
    scanAllowed,
    scansRemainingThisWeek,
    nextScanEligibleAt,
    daysUntilNextScan,
    monthlyUsage
  );
}

export function mergeEntitlements(base: Entitlements, patch: Partial<Entitlements>): Entitlements {
  return { ...base, ...patch };
}

export const UPGRADE_SCANS_EXHAUSTED_PATH = UPGRADE_WEEKLY_SCAN_PATH;

/** Career X-Ray hub — scan-based history. */
export function getCareerXRayPath(_entitlements: Entitlements): string {
  return "/xray-history";
}

/** Scan entry: form if allowed, otherwise upgrade. */
export function getNewScanPath(entitlements: Entitlements): string {
  if (entitlements.canRunScan) return "/scan";
  if (entitlements.hasRadar) return "/upgrade?product=transition&reason=monthly-scans";
  return UPGRADE_SCANS_EXHAUSTED_PATH;
}

export { DEFAULT as DEFAULT_ENTITLEMENTS };
