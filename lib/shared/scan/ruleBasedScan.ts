import type { FreeScanResult, NormalizedScanInput } from "../types";
import { formatRoleLabel } from "./inferTargetRole";
import {
  buildRecommendations,
  buildResilienceProfile,
  matchArchetype,
} from "./profileHelpers";

function buildSummary(
  input: NormalizedScanInput,
  current: ReturnType<typeof buildResilienceProfile>,
  topRole: string
): string {
  return `Based on your role as ${formatRoleLabel(input.currentRole)} in ${input.industry}, we identified realistic next roles. Your current role shows a resilience score of ${current.resilienceScore}/100 with ${current.aiExposureLabel.toLowerCase()}. Top path: ${formatRoleLabel(topRole)}.`;
}

/** Legacy rule-based Career Scan — superseded by generateHybridScan for native MVP. */
export function generateRuleBasedScan(input: NormalizedScanInput): FreeScanResult {
  const currentArchetype = matchArchetype(input.currentRole);
  const currentRoleProfile = buildResilienceProfile(input, input.currentRole, false);
  const recommendations = buildRecommendations(input);
  const primaryNextRole = recommendations[0]?.role ?? input.currentRole;
  const targetRoleProfile = buildResilienceProfile(input, primaryNextRole, true);

  currentRoleProfile.aiExposureLevel = currentArchetype.exposure;
  currentRoleProfile.aiExposureLabel = currentArchetype.exposureLabel;

  return {
    currentRole: formatRoleLabel(input.currentRole),
    targetRole: formatRoleLabel(primaryNextRole),
    identifiedCareerProfile: input.identifiedCareerProfile,
    currentRoleProfile,
    targetRoleProfile,
    summary: buildSummary(input, currentRoleProfile, primaryNextRole),
    initialRoleRecommendations: recommendations,
  };
}
