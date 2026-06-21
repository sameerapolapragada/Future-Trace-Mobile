import {
  featureRequiresCareerXrayPurchase,
  featureRequiresPremiumRefresh,
  featureRequiresTransitionSubscription,
  isFeatureAllowedForPlan,
} from "./features";
import { MVP_FEATURE_FLAGS } from "../shared/mvpFlags";
import { FREE_TIER_MODEL_CHAIN, modelForSource } from "./models";
import type { AiAccessContext, AiFeature, AiRouteDecision } from "./types";
import { PREMIUM_REFRESH_COOLDOWN_DAYS } from "./types";

function block(feature: AiFeature, reason: string): AiRouteDecision {
  return {
    feature,
    allowed: false,
    reason,
    source: null,
    model: null,
    reuseExisting: false,
  };
}

function allowExisting(feature: AiFeature): AiRouteDecision {
  return {
    feature,
    allowed: true,
    source: "existing_record",
    model: null,
    reuseExisting: true,
  };
}

function allowSource(
  feature: AiFeature,
  source: AiRouteDecision["source"] & string,
  cacheKey?: string
): AiRouteDecision {
  const dataSource = source as Exclude<typeof source, "existing_record">;
  return {
    feature,
    allowed: true,
    source,
    model: source === "existing_record" ? null : modelForSource(dataSource),
    modelChain: dataSource === "openrouter_free" ? [...FREE_TIER_MODEL_CHAIN] : undefined,
    reuseExisting: false,
    cacheKey,
  };
}

/** Resolve which model tier may serve a feature given entitlements. */
export function resolveModelRoute(
  feature: AiFeature,
  context: AiAccessContext,
  options?: { cacheKey?: string }
): AiRouteDecision {
  if (featureRequiresCareerXrayPurchase(feature) && !MVP_FEATURE_FLAGS.careerXrayPurchaseEnabled) {
    return block(feature, "Career X-Ray is coming soon.");
  }

  if (featureRequiresTransitionSubscription(feature) && !MVP_FEATURE_FLAGS.subscriptionsEnabled) {
    return block(feature, "AI Career Transition is coming soon.");
  }

  if (featureRequiresPremiumRefresh(feature) && !MVP_FEATURE_FLAGS.premiumMilestoneUnlockingEnabled) {
    return block(feature, "Premium roadmap refresh is coming soon.");
  }

  if (!MVP_FEATURE_FLAGS.advancedAiCoachingEnabled) {
    const coachingFeatures = new Set<AiFeature>([
      "transition_chat",
      "career_coaching",
      "resume_suggestions",
      "interview_guidance",
    ]);
    if (coachingFeatures.has(feature)) {
      return block(feature, "Advanced AI coaching is coming soon.");
    }
  }

  if (!MVP_FEATURE_FLAGS.dynamicLaborMarketUpdatesEnabled) {
    const marketFeatures = new Set<AiFeature>(["dynamic_recommendations", "market_radar_summary"]);
    if (marketFeatures.has(feature)) {
      return block(feature, "Dynamic labor market updates are coming soon.");
    }
  }

  if (featureRequiresCareerXrayPurchase(feature)) {
    if (context.hasExistingXrayResult) return allowExisting(feature);
    if (!context.hasCareerXrayPurchase && !context.hasTransitionSubscription) {
      return block(feature, "Career X-Ray purchase required ($1.99 one-time).");
    }
    return allowSource(feature, "openrouter_free", options?.cacheKey);
  }

  if (!isFeatureAllowedForPlan(feature, context.plan)) {
    return block(feature, "Feature not available on free plan. Purchase Career X-Ray or subscribe to AI Career Transition.");
  }

  if (featureRequiresTransitionSubscription(feature)) {
    if (!context.hasTransitionSubscription) {
      return block(feature, "AI Career Transition subscription required.");
    }
    return allowSource(feature, "gemini_flash", options?.cacheKey);
  }

  if (featureRequiresPremiumRefresh(feature)) {
    if (!context.hasTransitionSubscription) {
      return block(feature, "AI Career Transition subscription required for premium roadmap refresh.");
    }
    const days = context.daysSinceLastPremiumRefresh;
    if (days !== null && days < PREMIUM_REFRESH_COOLDOWN_DAYS) {
      return block(
        feature,
        `Premium roadmap refresh available in ${PREMIUM_REFRESH_COOLDOWN_DAYS - days} day(s).`
      );
    }
    return allowSource(feature, "gemini_pro", options?.cacheKey);
  }

  // Tier 0 free scan features
  if (context.hasExistingScanResult && feature === "career_profile_scan") {
    return allowExisting(feature);
  }

  if (context.plan === "free") {
    return allowSource(feature, "openrouter_free", options?.cacheKey);
  }

  // Subscribers running a scan use Flash (unlimited scans)
  if (feature === "career_profile_scan" || FREE_SCAN_FEATURES.has(feature)) {
    return allowSource(feature, "gemini_flash", options?.cacheKey);
  }

  return allowSource(feature, "gemini_flash", options?.cacheKey);
}

const FREE_SCAN_FEATURES = new Set<AiFeature>([
  "career_profile_scan",
  "current_role_analysis",
  "career_readiness_score",
  "skill_gap_summary",
  "career_recommendations_limited",
]);

/** Map user entitlements to plan enum. */
export function planFromEntitlements(hasTransitionSubscription: boolean): AiAccessContext["plan"] {
  return hasTransitionSubscription ? "career_transition" : "free";
}

export function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
}
