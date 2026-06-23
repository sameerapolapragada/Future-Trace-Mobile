import type { FreeScanResult } from "../types";
import { resolveDisruptionStatus, type DisruptionRadarStatus } from "./disruptionStatus";

export type DisruptionRadarRoleCard = {
  title: string;
  status: DisruptionRadarStatus;
  summary: string;
  detailPrimaryLabel: string;
  detailPrimary: string;
  detailSecondaryLabel: string;
  detailSecondary: string;
};

export type DisruptionRadarPageModel = {
  currentRole: DisruptionRadarRoleCard;
  targetRole: DisruptionRadarRoleCard;
};

export const DISRUPTION_LEVEL_LEGEND: {
  status: DisruptionRadarStatus;
  description: string;
}[] = [
  {
    status: "Stable",
    description: "AI enhances the role. Core responsibilities remain human-led.",
  },
  {
    status: "Evolving",
    description: "AI will change parts of the role. New skills and adaptation are key.",
  },
  {
    status: "At Risk",
    description: "High likelihood of automation or replacement of core responsibilities.",
  },
];

const STATUS_SUMMARY: Record<DisruptionRadarStatus, string> = {
  Stable: "Lower risk of disruption. AI will augment this role, not replace it.",
  Evolving: "Some parts of this role are likely to change with AI.",
  "At Risk": "Higher likelihood of automation or replacement of core responsibilities.",
};

function pickFirst(items: string[], fallback: string): string {
  return items.find((item) => item.trim().length > 0) ?? fallback;
}

function currentWhatsChanging(result: FreeScanResult): string {
  const profile = result.currentRoleProfile;
  return pickFirst(
    profile.vulnerabilities,
    profile.aiExposureLevel === "high"
      ? "AI is automating routine configuration, reporting, and support tasks."
      : profile.aiExposureLevel === "low"
        ? "AI tools may shift how supporting tasks are done, but core judgment work remains."
        : "AI is changing parts of typical workflows and routine task execution."
  );
}

function currentRemainsValuable(result: FreeScanResult): string {
  return pickFirst(
    result.currentRoleProfile.strengths,
    "Strategic decisions, business understanding, and human judgment in complex situations."
  );
}

function targetWhyStrong(result: FreeScanResult): string {
  const target = result.targetRoleProfile;
  return pickFirst(
    target.strengths,
    "This path focuses on durable responsibilities with lower automation pressure than your current role."
  );
}

function targetOpportunity(result: FreeScanResult): string {
  return pickFirst(
    result.targetRoleProfile.opportunityZones,
    "High demand for professionals who can adapt skills and implement AI responsibly."
  );
}

/** Structured content for the AI Disruption Radar screen. */
export function buildDisruptionRadarPageModel(result: FreeScanResult): DisruptionRadarPageModel {
  const currentStatus = resolveDisruptionStatus(result.currentRoleProfile);
  const targetStatus = resolveDisruptionStatus(result.targetRoleProfile);

  return {
    currentRole: {
      title: result.identifiedCareerProfile ?? result.currentRole,
      status: currentStatus,
      summary: STATUS_SUMMARY[currentStatus],
      detailPrimaryLabel: "What's changing",
      detailPrimary: currentWhatsChanging(result),
      detailSecondaryLabel: "What remains valuable",
      detailSecondary: currentRemainsValuable(result),
    },
    targetRole: {
      title: result.targetRole,
      status: targetStatus,
      summary: STATUS_SUMMARY[targetStatus],
      detailPrimaryLabel: targetStatus === "Stable" ? "Why it's more stable" : "Why it's a strong path",
      detailPrimary: targetWhyStrong(result),
      detailSecondaryLabel: "Key opportunity",
      detailSecondary: targetOpportunity(result),
    },
  };
}
