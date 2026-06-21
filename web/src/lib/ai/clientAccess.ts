import {
  buildAccessContext,
  orchestrate,
  type AiAccessContext,
  type AiFeature,
  type AiRouteDecision,
} from "@ft/ai";
import { isTransitionSubscriber } from "../subscriptionUsageService";
import { supabase } from "../supabaseClient";

export type { AiAccessContext, AiFeature, AiRouteDecision };
export { buildAccessContext, orchestrate };

/** Load entitlements from Supabase and build orchestration context. */
export async function loadAiAccessContext(options: {
  userId: string;
  scanId?: string;
  goalId?: string;
}): Promise<AiAccessContext> {
  const { userId, scanId, goalId } = options;

  const [isSub, xrayState, scanState, goalState] = await Promise.all([
    isTransitionSubscriber(userId),
    scanId ? loadXrayState(userId, scanId) : Promise.resolve(null),
    scanId ? loadScanState(userId, scanId) : Promise.resolve(null),
    goalId ? loadGoalRefreshState(userId, goalId) : Promise.resolve(null),
  ]);

  return buildAccessContext({
    hasTransitionSubscription: isSub,
    hasCareerXrayPurchase: xrayState?.hasPurchase ?? false,
    hasExistingXrayResult: xrayState?.hasResult ?? false,
    hasExistingScanResult: scanState?.hasResult ?? false,
    lastPremiumRefreshAt: goalState?.lastPremiumRefreshAt ?? null,
    scanId,
    goalId,
  });
}

async function loadXrayState(
  userId: string,
  scanId: string
): Promise<{ hasPurchase: boolean; hasResult: boolean }> {
  const { data } = await supabase
    .from("career_xrays")
    .select("status, xray_result_json")
    .eq("user_id", userId)
    .eq("scan_id", scanId)
    .maybeSingle();

  if (!data) return { hasPurchase: false, hasResult: false };

  const status = data.status as string;
  return {
    hasPurchase: status === "paid" || status === "generated",
    hasResult: status === "generated" && data.xray_result_json != null,
  };
}

async function loadScanState(
  userId: string,
  scanId: string
): Promise<{ hasResult: boolean }> {
  const { data } = await supabase
    .from("career_scans")
    .select("status, free_result_json, result")
    .eq("user_id", userId)
    .eq("id", scanId)
    .maybeSingle();

  if (!data) return { hasResult: false };
  return {
    hasResult:
      data.status === "complete" && (data.free_result_json != null || data.result != null),
  };
}

async function loadGoalRefreshState(
  userId: string,
  goalId: string
): Promise<{ lastPremiumRefreshAt: string | null }> {
  const { data } = await supabase
    .from("career_goals")
    .select("last_premium_refresh_at")
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  return { lastPremiumRefreshAt: (data?.last_premium_refresh_at as string | null) ?? null };
}

/** Whether a feature is allowed for the current user (client-side gating). */
export async function canUseAiFeature(
  userId: string,
  feature: AiFeature,
  options?: { scanId?: string; goalId?: string }
): Promise<AiRouteDecision> {
  const context = await loadAiAccessContext({ userId, ...options });
  return orchestrate(feature, context);
}

/** Gate Gemini Pro premium roadmap refresh (30-day cooldown). */
export async function canRunPremiumRoadmapRefresh(
  userId: string,
  goalId: string
): Promise<AiRouteDecision> {
  return canUseAiFeature(userId, "premium_roadmap_refresh", { goalId });
}

/** Whether free-tier user can access paid-only surfaces (always false for blocked features). */
export function isPaidFeature(feature: AiFeature): boolean {
  return feature !== "career_profile_scan"
    && feature !== "current_role_analysis"
    && feature !== "career_readiness_score"
    && feature !== "skill_gap_summary"
    && feature !== "career_recommendations_limited"
    && feature !== "career_xray_preview";
}
