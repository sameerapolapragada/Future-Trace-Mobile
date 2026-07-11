import type { NormalizedScanInput, ScanFormInput, WorkPreferenceNormalized } from "../types";
import { resolveCanonicalRole } from "./roleCanonicalization";

export function normalizeWorkPreference(value: string | undefined): WorkPreferenceNormalized {
  const lower = (value ?? "Hybrid").trim().toLowerCase();
  if (lower === "technical" || lower === "business" || lower === "hybrid") return lower;
  return "hybrid";
}

export function clampYearsExperience(raw: string): number {
  return Math.min(60, Math.max(0, parseInt(raw, 10) || 0));
}

/**
 * Normalize form input for next-roles scan.
 * Target role is no longer collected — placeholder until recommendations set the primary next path.
 */
export function normalizeScanInput(input: ScanFormInput): NormalizedScanInput {
  const rawCurrentRole = input.currentRole.trim();
  const current = resolveCanonicalRole(rawCurrentRole);
  const legacyTarget = (input.targetRole ?? "").trim();
  const target = legacyTarget ? resolveCanonicalRole(legacyTarget) : null;

  return {
    currentRole: current.canonical,
    targetRole: target?.canonical ?? current.canonical,
    identifiedCareerProfile: current.canonical,
    industry: input.industry.trim() || "General",
    yearsExperience: clampYearsExperience(input.yearsExperience),
    skills: input.skills.trim() || "—",
    tools: input.tools.trim() || "—",
    careerGoal: (input.careerGoal ?? "").trim() || "Explore realistic next roles",
    workPreference: normalizeWorkPreference(input.workPreference),
  };
}
