import type { AiFeature, UserPlan } from "./types";

/**
 * Tier 0 — OpenRouter chain (GPT-OSS-120B → GPT-OSS-20B → openrouter/free).
 * Gemini Flash is reserved for post-purchase / subscriber features.
 */
export const FREE_TIER_FEATURES = new Set<AiFeature>([
  "career_profile_scan", // free weekly scan
  "current_role_analysis", // career profile analysis
  "career_readiness_score",
  "skill_gap_summary",
  "career_recommendations_limited", // initial role recommendations
  "career_xray_preview", // teaser before $1.99 full X-Ray
]);

/** Features requiring one-time Career X-Ray purchase (Gemini Flash, once). */
export const CAREER_XRAY_FEATURES = new Set<AiFeature>([
  "career_xray_report",
  "top_target_roles",
  "transferability_score",
  "salary_analysis",
  "skill_gap_analysis",
  "career_risk_score",
]);

/** Features requiring AI Career Transition subscription (Gemini Flash). */
export const TRANSITION_SUBSCRIPTION_FEATURES = new Set<AiFeature>([
  "weekly_milestone_update",
  "transition_chat",
  "dynamic_recommendations",
  "career_coaching",
  "resume_suggestions",
  "interview_guidance",
  "market_radar_summary",
]);

/** Premium roadmap refresh — Gemini Pro, max once per 30 days. */
export const PREMIUM_REFRESH_FEATURES = new Set<AiFeature>(["premium_roadmap_refresh"]);

/** Explicitly blocked for free users (upsell surfaces). */
export const FREE_TIER_BLOCKED_FEATURES = new Set<AiFeature>([
  ...CAREER_XRAY_FEATURES,
  ...TRANSITION_SUBSCRIPTION_FEATURES,
  ...PREMIUM_REFRESH_FEATURES,
]);

export function isFeatureAllowedForPlan(feature: AiFeature, plan: UserPlan): boolean {
  if (plan === "career_transition") {
    if (PREMIUM_REFRESH_FEATURES.has(feature)) return true;
    if (TRANSITION_SUBSCRIPTION_FEATURES.has(feature)) return true;
    if (CAREER_XRAY_FEATURES.has(feature)) return true;
    return FREE_TIER_FEATURES.has(feature);
  }

  return FREE_TIER_FEATURES.has(feature);
}

export function featureRequiresCareerXrayPurchase(feature: AiFeature): boolean {
  return CAREER_XRAY_FEATURES.has(feature);
}

export function featureRequiresTransitionSubscription(feature: AiFeature): boolean {
  return TRANSITION_SUBSCRIPTION_FEATURES.has(feature);
}

export function featureRequiresPremiumRefresh(feature: AiFeature): boolean {
  return PREMIUM_REFRESH_FEATURES.has(feature);
}
