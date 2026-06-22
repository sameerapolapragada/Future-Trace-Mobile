import {
  CATEGORY_DRIVER_LABELS,
  CATEGORY_WEIGHTS,
  classifyTask,
  EXPOSURE_DECREASE_CATEGORIES,
  EXPOSURE_INCREASE_CATEGORIES,
} from "./classifyTasks";
import type { ExposureCategory, ExposureLevelLabel, ExposureScoreResult, ScoringInput } from "./types";
import type { AIExposureLevel } from "../types";

const BASE_SCORE = 48;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function scoreToExposureLevel(score: number): ExposureLevelLabel {
  if (score <= 39) return "Low";
  if (score <= 69) return "Moderate";
  return "High";
}

export function exposureLevelToAiExposureLevel(level: ExposureLevelLabel): AIExposureLevel {
  if (level === "Low") return "low";
  if (level === "High") return "high";
  return "medium";
}

export function exposureLevelLabel(level: ExposureLevelLabel): string {
  if (level === "Low") return "Lower automation exposure";
  if (level === "High") return "Higher automation exposure";
  return "Moderate automation exposure";
}

function countCategories(tasks: string[]): Partial<Record<ExposureCategory, number>> {
  const counts: Partial<Record<ExposureCategory, number>> = {};
  for (const task of tasks) {
    const category = classifyTask(task);
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

function hasAiFamiliarity(skills: string, tools: string): boolean {
  const text = `${skills} ${tools}`.toLowerCase();
  return /\b(ai|ml|machine learning|llm|gpt|copilot|automation|prompt|chatbot|python|sql|cloud)\b/.test(text);
}

function hasStrongTechnicalSkills(skills: string, tools: string): boolean {
  const text = `${skills} ${tools}`.toLowerCase();
  return /\b(engineer|developer|architect|programming|software|systems|security|devops|data science)\b/.test(text);
}

function topDrivers(counts: Partial<Record<ExposureCategory, number>>, categories: ExposureCategory[]): string[] {
  return categories
    .filter((c) => (counts[c] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
    .slice(0, 3)
    .map((c) => CATEGORY_DRIVER_LABELS[c]);
}

function selectAffectedTasks(tasks: string[], limit = 4): string[] {
  return tasks
    .filter((task) => EXPOSURE_INCREASE_CATEGORIES.includes(classifyTask(task)))
    .slice(0, limit);
}

function selectProtectedStrengths(
  counts: Partial<Record<ExposureCategory, number>>,
  onetSkills: string[],
  userSkills: string
): string[] {
  const strengths = topDrivers(counts, EXPOSURE_DECREASE_CATEGORIES);
  const userSkillTokens = userSkills
    .split(/[,;\n/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  const merged = [
    ...strengths,
    ...onetSkills.slice(0, 2).map((s) => `${s} (O*NET skill)`),
    ...userSkillTokens.map((s) => `Strong ${s} experience`),
  ];

  return [...new Set(merged)].slice(0, 4);
}

/**
 * Deterministic AI Exposure Score — always computed here, never by an LLM.
 */
export function calculateExposureScore(input: ScoringInput): ExposureScoreResult {
  const tasks = input.tasks.length > 0 ? input.tasks : [];
  const counts = countCategories(tasks);

  let score = BASE_SCORE;

  for (const [category, count] of Object.entries(counts) as [ExposureCategory, number][]) {
    score += count * (CATEGORY_WEIGHTS[category] ?? 0);
  }

  // Empty tasks: mild neutral bump — rely on user modifiers and fallback context
  if (tasks.length === 0) {
    score += 6;
  }

  if (input.yearsExperience >= 8) score -= 3;
  else if (input.yearsExperience < 3) score += 2;

  if (hasAiFamiliarity(input.skills, input.tools)) score -= 4;
  if (hasStrongTechnicalSkills(input.skills, input.tools)) score -= 3;

  const industryLower = input.industry.toLowerCase();
  if (/tech|software|saas|ai/.test(industryLower)) score += 2;
  if (/healthcare|legal|finance|government/.test(industryLower)) score -= 2;

  const aiExposureScore = clampScore(score);
  const exposureLevel = scoreToExposureLevel(aiExposureScore);
  const aiExposureLevel = exposureLevelToAiExposureLevel(exposureLevel);

  const keyExposureDrivers = topDrivers(counts, EXPOSURE_INCREASE_CATEGORIES);
  const protectedStrengths = selectProtectedStrengths(counts, input.onetSkills, input.skills);
  const affectedTasks = selectAffectedTasks(tasks);

  if (keyExposureDrivers.length === 0 && tasks.length > 0) {
    keyExposureDrivers.push("Mixed task profile with limited routine automation signals");
  }

  return {
    aiExposureScore,
    exposureLevel,
    aiExposureLevel,
    aiExposureLabel: exposureLevelLabel(exposureLevel),
    keyExposureDrivers,
    protectedStrengths,
    affectedTasks,
    categoryBreakdown: counts,
  };
}

/** Archetype fallback when O*NET match is unavailable — preserves prior app behavior. */
export function fallbackExposureFromArchetype(level: AIExposureLevel): ExposureScoreResult {
  const scoreMap: Record<AIExposureLevel, number> = { low: 32, medium: 55, high: 76 };
  const aiExposureScore = scoreMap[level];
  const exposureLevel = scoreToExposureLevel(aiExposureScore);

  return {
    aiExposureScore,
    exposureLevel,
    aiExposureLevel: level,
    aiExposureLabel: exposureLevelLabel(exposureLevel),
    keyExposureDrivers: ["Role-based estimate (O*NET match unavailable)"],
    protectedStrengths: ["Adaptable skill mix", "Problem-solving mindset"],
    affectedTasks: [],
    categoryBreakdown: {},
  };
}
