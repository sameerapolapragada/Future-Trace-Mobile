import type { FreeScanResult, NormalizedScanInput } from "../types";
import { formatRoleLabel } from "./inferTargetRole";
import {
  buildRecommendations,
  buildResilienceProfile,
  matchArchetype,
  transitionGapScore,
} from "./profileHelpers";

function buildSummary(input: NormalizedScanInput, current: ReturnType<typeof buildResilienceProfile>, target: ReturnType<typeof buildResilienceProfile>): string {
  const gap = transitionGapScore(input.currentRole, input.targetRole);
  const difficulty =
    gap >= 55 ? "a meaningful transition that will take focused upskilling" : "a realistic next step with steady preparation";

  return `Your scan compares ${formatRoleLabel(input.currentRole)} with a target of ${formatRoleLabel(input.targetRole)} in ${input.industry}. Your current role shows a resilience score of ${current.resilienceScore}/100 with ${current.aiExposureLabel.toLowerCase()}. Moving toward your target (${target.resilienceScore}/100 resilience) looks like ${difficulty}.`;
}

/** Legacy rule-based Career Scan — superseded by generateHybridScan for native MVP. */
export function generateRuleBasedScan(input: NormalizedScanInput): FreeScanResult {
  const currentArchetype = matchArchetype(input.currentRole);
  const currentRoleProfile = buildResilienceProfile(input, input.currentRole, false);
  const targetRoleProfile = buildResilienceProfile(input, input.targetRole, true);

  // Ensure exposure label from archetype when not using hybrid engine
  currentRoleProfile.aiExposureLevel = currentArchetype.exposure;
  currentRoleProfile.aiExposureLabel = currentArchetype.exposureLabel;

  return {
    currentRole: formatRoleLabel(input.currentRole),
    targetRole: formatRoleLabel(input.targetRole),
    identifiedCareerProfile: input.identifiedCareerProfile,
    currentRoleProfile,
    targetRoleProfile,
    summary: buildSummary(input, currentRoleProfile, targetRoleProfile),
    initialRoleRecommendations: buildRecommendations(input),
  };
}
