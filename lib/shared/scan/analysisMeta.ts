import type { AIExposureLevel, ExposureMeta } from "../types";

export const CAREER_ANALYSIS_SOURCE =
  "Career analysis informed by occupational benchmark data and Future Trace scoring models.";

export type ExposureLevelDisplay = "Low" | "Moderate" | "High";

export function formatExposureLevelDisplay(level: AIExposureLevel): ExposureLevelDisplay {
  if (level === "low") return "Low";
  if (level === "high") return "High";
  return "Moderate";
}

export function aiExposureInsightCopy(level: AIExposureLevel): string {
  if (level === "low") {
    return "This role has lower near-term exposure to AI automation, but AI fluency can still improve long-term career resilience.";
  }
  if (level === "high") {
    return "This role is increasingly influenced by AI tools, but strong domain expertise and strategic skills can continue to create value.";
  }
  return "AI tools are likely to change parts of this role's workflow. Building AI-adjacent skills can help you stay ahead.";
}

export type AnalysisConfidenceLabel = "High" | "Moderate" | "Limited";

export type AnalysisConfidence = {
  percent: number;
  label: AnalysisConfidenceLabel;
};

/** User-facing confidence for how well the entered role matched an occupational benchmark. */
export function formatAnalysisConfidence(meta?: ExposureMeta): AnalysisConfidence {
  if (!meta || meta.matchedVia === "fallback_archetype") {
    return { percent: 42, label: "Limited" };
  }

  const raw = meta.matchConfidence ?? 0.75;
  const percent = Math.min(100, Math.max(0, Math.round(raw * 100)));

  if (percent >= 75) return { percent, label: "High" };
  if (percent >= 50) return { percent, label: "Moderate" };
  return { percent, label: "Limited" };
}

export function formatBenchmarkRoleTitle(meta?: ExposureMeta): string | null {
  if (!meta?.onetOccupationTitle || meta.matchedVia === "fallback_archetype") return null;
  return meta.onetOccupationTitle;
}
