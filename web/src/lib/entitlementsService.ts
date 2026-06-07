import { supabase } from "./supabaseClient";
import type { Entitlements } from "../types";

type UserEntitlementsRow = {
  free_scans_remaining: number;
  has_career_xray: boolean;
  has_radar: boolean;
};

const DEFAULT: Entitlements = {
  freeScansRemaining: 1,
  hasCareerXRay: false,
  hasRadar: false,
  hasCompletedScan: false,
};

function mapRow(row: UserEntitlementsRow, hasCompletedScan: boolean): Entitlements {
  return {
    freeScansRemaining: row.free_scans_remaining,
    hasCareerXRay: row.has_career_xray,
    hasRadar: row.has_radar,
    hasCompletedScan,
  };
}

export async function fetchUserEntitlements(userId: string): Promise<Entitlements> {
  const [entitlementsResult, scansResult] = await Promise.all([
    supabase
      .from("user_entitlements")
      .select("free_scans_remaining, has_career_xray, has_radar")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("career_scans").select("id").eq("user_id", userId).limit(1),
  ]);

  if (entitlementsResult.error) {
    throw entitlementsResult.error;
  }

  if (scansResult.error) {
    throw scansResult.error;
  }

  const hasCompletedScan = (scansResult.data?.length ?? 0) > 0;

  if (!entitlementsResult.data) {
    return { ...DEFAULT, hasCompletedScan };
  }

  return mapRow(entitlementsResult.data, hasCompletedScan);
}

export function mergeEntitlements(base: Entitlements, patch: Partial<Entitlements>): Entitlements {
  return { ...base, ...patch };
}

export { DEFAULT as DEFAULT_ENTITLEMENTS };
