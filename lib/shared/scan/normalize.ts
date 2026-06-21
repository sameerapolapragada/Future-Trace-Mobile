import type { NormalizedScanInput, ScanFormInput, WorkPreferenceNormalized } from "../types";
import { inferTargetRole } from "./inferTargetRole";

export function normalizeWorkPreference(value: string): WorkPreferenceNormalized {
  const lower = value.trim().toLowerCase();
  if (lower === "technical" || lower === "business" || lower === "hybrid") return lower;
  return "hybrid";
}

export function clampYearsExperience(raw: string): number {
  return Math.min(60, Math.max(0, parseInt(raw, 10) || 0));
}

export function normalizeScanInput(input: ScanFormInput): NormalizedScanInput {
  const currentRole = input.currentRole.trim();
  const targetRole =
    input.targetRole.trim() || inferTargetRole(input.careerGoal, currentRole || "—");

  return {
    currentRole,
    targetRole,
    industry: input.industry.trim() || "General",
    yearsExperience: clampYearsExperience(input.yearsExperience),
    skills: input.skills.trim() || "—",
    tools: input.tools.trim() || "—",
    careerGoal: input.careerGoal.trim() || targetRole,
    workPreference: normalizeWorkPreference(input.workPreference),
  };
}
