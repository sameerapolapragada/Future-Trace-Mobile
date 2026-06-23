import { firstCareerRecommendationRole } from "../scan/careerRecommendations";
import type { DisruptionRadarSnapshot, FreeScanResult } from "../types";

function readinessLabel(score: number): string {
  if (score >= 75) return "Well positioned";
  if (score >= 55) return "Building momentum";
  return "Early stage";
}

/** Informational radar derived from the latest rule-based scan — not live market data. */
export function buildDisruptionRadarFromScan(result: FreeScanResult): DisruptionRadarSnapshot {
  const current = result.currentRoleProfile;
  const target = result.targetRoleProfile;
  const readinessScore = Math.round((current.resilienceScore + target.resilienceScore) / 2);

  const automationPressure =
    current.aiExposureScore ??
    (current.aiExposureLevel === "high" ? 72 : current.aiExposureLevel === "medium" ? 54 : 36);
  const skillAlignment = Math.min(
    92,
    Math.max(28, 100 - Math.abs(current.resilienceScore - target.resilienceScore))
  );
  const transitionReadiness = Math.min(90, Math.round((readinessScore + skillAlignment) / 2));

  return {
    headline: "AI Disruption Radar",
    summary: `Based on your Career Scan, ${result.currentRole} faces ${current.aiExposureLabel.toLowerCase()} while your target path (${result.targetRole}) shows ${target.aiExposureLabel.toLowerCase()}. Scores are illustrative guidance, not real-time labor market data.`,
    readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    subMetrics: [
      { label: "Automation pressure", value: automationPressure, tone: "danger" },
      { label: "Skill alignment", value: skillAlignment, tone: "accent" },
      { label: "Transition readiness", value: transitionReadiness, tone: "success" },
    ],
    strengths: current.strengths.slice(0, 3),
    watchAreas: current.vulnerabilities.slice(0, 3),
    signals: [
      {
        title: "Role automation exposure",
        detail: current.aiExposureLabel,
        trend: current.aiExposureLevel === "high" ? "down" : "flat",
      },
      {
        title: "Target role durability",
        detail: `${target.resilienceScore}/100 resilience`,
        trend: target.resilienceScore >= 70 ? "up" : "flat",
      },
      {
        title: "Adjacent opportunities",
        detail: firstCareerRecommendationRole(result.initialRoleRecommendations, result.targetRole),
        trend: "up",
      },
    ],
  };
}
