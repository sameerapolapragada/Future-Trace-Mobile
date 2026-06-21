import { resolveOrchestration } from "./resolver";
import { resolveModelRoute, planFromEntitlements, daysSince } from "./router";
import type { AiAccessContext, AiFeature, AiOrchestrationRequest, AiRouteDecision } from "./types";

export type OrchestrateOptions = Omit<AiOrchestrationRequest, "feature" | "context">;

/**
 * Primary entry point for AI orchestration.
 * Call from BFF route handlers before any LLM invocation.
 */
export function orchestrate(
  feature: AiFeature,
  context: AiAccessContext,
  options: OrchestrateOptions = {}
): AiRouteDecision {
  return resolveOrchestration({ feature, context, ...options });
}

export function buildAccessContext(input: {
  hasTransitionSubscription: boolean;
  hasCareerXrayPurchase: boolean;
  hasExistingXrayResult?: boolean;
  hasExistingScanResult?: boolean;
  lastPremiumRefreshAt?: string | null;
  scanId?: string;
  goalId?: string;
}): AiAccessContext {
  return {
    plan: planFromEntitlements(input.hasTransitionSubscription),
    hasTransitionSubscription: input.hasTransitionSubscription,
    hasCareerXrayPurchase: input.hasCareerXrayPurchase,
    hasExistingXrayResult: input.hasExistingXrayResult ?? false,
    hasExistingScanResult: input.hasExistingScanResult ?? false,
    daysSinceLastPremiumRefresh: daysSince(input.lastPremiumRefreshAt),
    scanId: input.scanId,
    goalId: input.goalId,
  };
}

export { resolveOrchestration, resolveModelRoute, planFromEntitlements, daysSince };
