import type { FreeScanResult } from "../types";

export type DisruptionRadarStatus = "Stable" | "Evolving" | "At Risk";

export type DisruptionRadarBrief = {
  status: DisruptionRadarStatus;
  explanation: string;
  nextAction: string;
};

function resolveStatus(result: FreeScanResult): DisruptionRadarStatus {
  const current = result.currentRoleProfile;

  if (current.aiExposureLevel === "high" || current.resilienceScore < 52) {
    return "At Risk";
  }

  if (current.aiExposureLevel === "low" && current.resilienceScore >= 68) {
    return "Stable";
  }

  return "Evolving";
}

/** Compact disruption snapshot for Career Scan Results — informational only. */
export function buildDisruptionRadarBrief(result: FreeScanResult): DisruptionRadarBrief {
  const status = resolveStatus(result);
  const adjacent = result.initialRoleRecommendations[0] ?? result.targetRole;

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
