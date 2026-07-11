import type { FreeScanResult, NormalizedScanInput, RoleScanProfile } from "../types";
import type { OnetClientConfig, OnetMatchResult } from "../onet/types";
import type { OccupationDataProvider } from "../onet/provider";
import { createBundledOccupationProvider } from "../onet/provider";
import { generateExposureExplanation, type ExplanationConfig } from "../exposure/explanationService";
import {
  calculateExposureScore,
  fallbackExposureFromArchetype,
} from "../exposure/scoringEngine";
import type { ExposureScoreResult, ScoringInput } from "../exposure/types";
import { formatRoleLabel } from "../scan/inferTargetRole";
import {
  buildRecommendations,
  buildResilienceProfile,
  getArchetypeExposureLevel,
} from "../scan/profileHelpers";

export type HybridScanConfig = {
  /** Pluggable occupation source — defaults to bundled on-device O*NET index. */
  occupationProvider?: OccupationDataProvider;
  onet?: OnetClientConfig;
  explanation?: ExplanationConfig;
};

function getOccupationProvider(config: HybridScanConfig): OccupationDataProvider {
  if (config.occupationProvider) return config.occupationProvider;
  return createBundledOccupationProvider({ cache: config.onet?.cache });
}

function toScoringInput(
  input: NormalizedScanInput,
  match: OnetMatchResult | null,
  role: string
): ScoringInput {
  return {
    currentRole: role,
    industry: input.industry,
    yearsExperience: input.yearsExperience,
    skills: input.skills,
    tools: input.tools,
    occupationTitle: match?.occupation.title,
    tasks: match?.occupation.tasks ?? [],
    onetSkills: match?.occupation.skills ?? [],
    workActivities: match?.occupation.workActivities ?? [],
  };
}

function mergeProfile(
  input: NormalizedScanInput,
  role: string,
  isTarget: boolean,
  exposure: ExposureScoreResult
): RoleScanProfile {
  const base = buildResilienceProfile(input, role, isTarget);

  return {
    ...base,
    aiExposureScore: exposure.aiExposureScore,
    aiExposureLevel: exposure.aiExposureLevel,
    aiExposureLabel: exposure.aiExposureLabel,
  };
}

async function scoreRole(
  input: NormalizedScanInput,
  role: string,
  provider: OccupationDataProvider
): Promise<{ exposure: ExposureScoreResult; match: OnetMatchResult | null }> {
  const match = await provider.resolveOccupation(role);

  if (match) {
    const scoringInput = toScoringInput(input, match, role);
    return { exposure: calculateExposureScore(scoringInput), match };
  }

  const archetypeLevel = getArchetypeExposureLevel(role);
  return { exposure: fallbackExposureFromArchetype(archetypeLevel), match: null };
}

function buildNextRolesSummary(
  input: NormalizedScanInput,
  current: RoleScanProfile,
  topRole: string,
  explanationText: string
): string {
  return `${explanationText} Based on your role as ${formatRoleLabel(input.currentRole)} in ${input.industry}, we identified realistic next roles you can move into. Your current role resilience is ${current.resilienceScore}/100. Top path: ${formatRoleLabel(topRole)}. Salaries and timelines are national estimates for planning — not guarantees.`;
}

/** Hybrid Career Scan: current-role analysis + top next-role recommendations. */
export async function generateHybridScan(
  input: NormalizedScanInput,
  config: HybridScanConfig = {}
): Promise<FreeScanResult> {
  const provider = getOccupationProvider(config);
  const currentMatch = await provider.resolveOccupation(input.currentRole);
  const currentScoringInput = toScoringInput(input, currentMatch, input.currentRole);
  const currentExposure = currentMatch
    ? calculateExposureScore(currentScoringInput)
    : fallbackExposureFromArchetype(getArchetypeExposureLevel(input.currentRole));

  const explanation = await generateExposureExplanation(
    currentScoringInput,
    currentExposure,
    config.explanation ?? {}
  );

  const recommendations = buildRecommendations(input);
  const primaryNextRole = recommendations[0]?.role ?? input.currentRole;

  const { exposure: nextRoleExposure } = await scoreRole(input, primaryNextRole, provider);

  const currentRoleProfile = mergeProfile(input, input.currentRole, false, currentExposure);
  const targetRoleProfile = mergeProfile(input, primaryNextRole, true, nextRoleExposure);

  const summary = buildNextRolesSummary(
    input,
    currentRoleProfile,
    primaryNextRole,
    explanation.explanation
  );

  return {
    currentRole: formatRoleLabel(input.currentRole),
    targetRole: formatRoleLabel(primaryNextRole),
    identifiedCareerProfile: input.identifiedCareerProfile,
    currentRoleProfile,
    targetRoleProfile,
    summary,
    initialRoleRecommendations: recommendations,
    exposureMeta: {
      onetOccupationCode: currentMatch?.occupation.code,
      onetOccupationTitle: currentMatch?.occupation.title,
      matchConfidence: currentMatch?.matchScore,
      matchedVia: currentMatch?.matchedVia ?? "fallback_archetype",
      keyExposureDrivers: currentExposure.keyExposureDrivers,
      affectedTasks: currentExposure.affectedTasks,
      protectedStrengths: currentExposure.protectedStrengths,
    },
  };
}
