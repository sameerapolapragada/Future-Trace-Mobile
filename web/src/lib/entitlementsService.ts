import { supabase } from "./supabaseClient";
import { canRunScan } from "./accessService";
import type { Entitlements } from "../types";

type UserEntitlementsRow = {
  has_radar: boolean;
  subscription_expires_at: string | null;
};

const DEFAULT: Entitlements = {
  hasRadar: false,
  hasCompletedScan: false,
  canRunScan: true,
};

function mapRow(
  row: UserEntitlementsRow,
  hasCompletedScan: boolean,
  scanAllowed: boolean
): Entitlements {
  const hasRadar =
    row.has_radar &&
    (!row.subscription_expires_at || new Date(row.subscription_expires_at) > new Date());

  return {
    hasRadar,
    hasCompletedScan,
    canRunScan: hasRadar || scanAllowed,
  };
}

export async function fetchUserEntitlements(userId: string): Promise<Entitlements> {
  let scanAllowed = true;
  try {
    scanAllowed = await canRunScan(userId);
  } catch {
    scanAllowed = true;
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
    return { ...DEFAULT, hasCompletedScan, canRunScan: scanAllowed };
  }

  return mapRow(entitlementsResult.data, hasCompletedScan, scanAllowed);
}

export function mergeEntitlements(base: Entitlements, patch: Partial<Entitlements>): Entitlements {
  return { ...base, ...patch };
}

export const UPGRADE_SCANS_EXHAUSTED_PATH = "/upgrade?reason=weekly-scan";

/** Career X-Ray hub — scan-based history. */
export function getCareerXRayPath(_entitlements: Entitlements): string {
  return "/xray-history";
}

/** Scan entry: form if allowed, otherwise Radar upgrade. */
export function getNewScanPath(entitlements: Entitlements): string {
  if (entitlements.canRunScan) return "/scan";
  return UPGRADE_SCANS_EXHAUSTED_PATH;
}

export { DEFAULT as DEFAULT_ENTITLEMENTS };
