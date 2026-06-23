import { firstCareerRecommendationRole } from "../scan/careerRecommendations";
import type { FreeScanResult, RoleScanProfile } from "../types";

export type DisruptionRadarStatus = "Stable" | "Evolving" | "At Risk";

export type DisruptionRadarBrief = {
  status: DisruptionRadarStatus;
  explanation: string;
  nextAction: string;
};

export function resolveDisruptionStatus(profile: RoleScanProfile): DisruptionRadarStatus {
  if (profile.aiExposureLevel === "high" || profile.resilienceScore < 52) {
    return "At Risk";
  }

  if (profile.aiExposureLevel === "low" && profile.resilienceScore >= 68) {
    return "Stable";
  }

  return "Evolving";
}

function resolveStatus(result: FreeScanResult): DisruptionRadarStatus {
  return resolveDisruptionStatus(result.currentRoleProfile);
}

/** Compact disruption snapshot for Career Scan Results — informational only. */
export function buildDisruptionRadarBrief(result: FreeScanResult): DisruptionRadarBrief {
  const status = resolveStatus(result);
  const adjacent = firstCareerRecommendationRole(result.initialRoleRecommendations, result.targetRole);

  const copy: Record<
    DisruptionRadarStatus,
    { explanation: string; nextAction: string }
  > = {
    Stable: {
      explanation: `Your current role shows lower automation pressure and solid resilience in this scan.`,
      nextAction: "Keep building adjacent skills and rerun your scan when your goals change.",
    },
    Evolving: {
      explanation: `Your role is shifting as AI tools change typical workflows—worth monitoring closely.`,
      nextAction: `Explore pathways toward ${adjacent} and focus on the opportunity zones above.`,
    },
    "At Risk": {
      explanation: `Your current role shows elevated automation exposure or lower resilience in this scan.`,
      nextAction: "Prioritize upskilling in your watch areas and clarify your target transition path.",
    },
  };

  return {
    status,
    explanation: copy[status].explanation,
    nextAction: copy[status].nextAction,
  };
}
