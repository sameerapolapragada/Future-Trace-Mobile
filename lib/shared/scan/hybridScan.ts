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
  transitionGapScore,
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

function buildHybridSummary(
  input: NormalizedScanInput,
  current: RoleScanProfile,
  target: RoleScanProfile,
  explanationText: string,
  whyLevel: string
): string {
  const gap = transitionGapScore(input.currentRole, input.targetRole);
  const difficulty =
    gap >= 55 ? "a meaningful transition that will take focused upskilling" : "a realistic next step with steady preparation";

  return `${explanationText} ${whyLevel} Your scan compares ${formatRoleLabel(input.currentRole)} with a target of ${formatRoleLabel(input.targetRole)} in ${input.industry}. Current role resilience is ${current.resilienceScore}/100; target role resilience is ${target.resilienceScore}/100. Moving toward your target looks like ${difficulty}.`;
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

/** Hybrid Career Scan: bundled O*NET mapping + on-device scoring + optional explanation. */
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

  const { exposure: targetExposure } = await scoreRole(input, input.targetRole, provider);

  const explanation = await generateExposureExplanation(
    currentScoringInput,
    currentExposure,
    config.explanation ?? {}
  );

  const currentRoleProfile = mergeProfile(
    input,
    input.currentRole,
    false,
    currentExposure
  );

  const targetRoleProfile = mergeProfile(
    input,
    input.targetRole,
    true,
    targetExposure
  );

  const summary = buildHybridSummary(
    input,
    currentRoleProfile,
    targetRoleProfile,
    explanation.explanation,
    explanation.whyThisLevel
  );

  return {
    currentRole: formatRoleLabel(input.currentRole),
    targetRole: formatRoleLabel(input.targetRole),
    identifiedCareerProfile: input.identifiedCareerProfile,
    currentRoleProfile,
    targetRoleProfile,
    summary,
    initialRoleRecommendations: buildRecommendations(input),
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
