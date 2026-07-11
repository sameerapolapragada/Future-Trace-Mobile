import { getLocalOccupationByCode, LOCAL_ONET_INDEX } from "./localIndex";
import { matchLocalOccupation } from "./matchOccupation";
import type { OnetOccupation } from "./types";

function normalizeLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const stop = new Set(["and", "the", "or", "of", "a", "an", "in", "for", "to", "with", "on"]);
  return normalizeLabel(text)
    .split(" ")
    .filter((t) => t.length > 2 && !stop.has(t));
}

function jaccard(a: string[], b: string[]): number {
  const left = new Set(a.map(normalizeLabel).filter(Boolean));
  const right = new Set(b.map(normalizeLabel).filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;

  let intersect = 0;
  for (const item of left) {
    if (right.has(item)) intersect += 1;
  }
  return intersect / (left.size + right.size - intersect);
}

function taskTokenOverlap(a: string[], b: string[]): number {
  const left = new Set(a.flatMap((task) => tokenize(task)));
  const right = new Set(b.flatMap((task) => tokenize(task)));
  if (left.size === 0 || right.size === 0) return 0;

  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }
  return hits / Math.max(left.size, right.size);
}

/**
 * Skill-distance similarity between two O*NET occupations (0–1).
 * Higher = closer transferable skill/activity profile.
 */
export function occupationSimilarity(source: OnetOccupation, target: OnetOccupation): number {
  // Same SOC cluster is strongly related, but not identical — lets keyword evidence
  // differentiate destinations that share one occupation snapshot (e.g. security roles).
  if (source.code === target.code) return 0.88;

  const skillSim = jaccard(source.skills, target.skills);
  const activitySim = jaccard(source.workActivities, target.workActivities);
  const taskSim = taskTokenOverlap(source.tasks, target.tasks);

  return Math.min(1, skillSim * 0.5 + activitySim * 0.3 + taskSim * 0.2);
}

/** Shared O*NET skill labels between two occupations, most common first. */
export function sharedOccupationSkills(
  source: OnetOccupation,
  target: OnetOccupation,
  limit = 3
): string[] {
  const targetSkills = new Set(target.skills.map(normalizeLabel));
  const shared = source.skills.filter((skill) => targetSkills.has(normalizeLabel(skill)));
  return shared.slice(0, limit);
}

export function resolveLocalOccupation(role: string, onetCode?: string): OnetOccupation | null {
  if (onetCode) {
    const byCode = getLocalOccupationByCode(onetCode);
    if (byCode) return byCode;
  }
  return matchLocalOccupation(role)?.occupation ?? null;
}

export type RelatedOccupation = {
  occupation: OnetOccupation;
  similarity: number;
};

/** Rank other local O*NET occupations by skill/activity distance from a source role. */
export function rankRelatedOccupations(sourceRole: string, limit = 8): RelatedOccupation[] {
  const source = resolveLocalOccupation(sourceRole);
  if (!source) return [];

  return LOCAL_ONET_INDEX.filter((occupation) => occupation.code !== source.code)
    .map((occupation) => ({
      occupation,
      similarity: occupationSimilarity(source, occupation),
    }))
    .filter((item) => item.similarity >= 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Optional O*NET SOC links for destination titles that don't match well by name alone.
 * Keeps catalog titles product-friendly while scoring against real occupation profiles.
 */
export const DESTINATION_ONET_CODES: Record<string, string> = {
  "Security Operations Analyst": "15-1212.00",
  "Cloud Security Analyst": "15-1299.08",
  "GRC / Compliance Analyst": "13-1111.00",
  "Identity & Access Analyst": "15-1244.00",
  "Application Security Analyst": "15-1212.00",
  "Security Engineer": "15-1212.00",
  "Cybersecurity Consultant": "15-1212.00",
  "Salesforce AI Administrator": "15-1211.00",
  "Agentforce Specialist": "15-1211.00",
  "Salesforce Automation Consultant": "15-1211.00",
  "Salesforce Business Analyst": "15-1211.00",
  "Salesforce Developer": "15-1252.00",
  "AI-Assisted Software Developer": "15-1252.00",
  "Integration Developer": "15-1252.00",
  "Automation Engineer": "15-1252.00",
  "DevOps Engineer": "15-1299.08",
  "Cloud Engineer": "15-1299.08",
  "Platform Support Engineer": "15-1232.00",
  "Solutions Engineer": "15-1299.08",
  "AI Data Analyst": "15-2051.01",
  "Analytics Engineer": "15-2051.01",
  "BI Automation Analyst": "15-2051.01",
  "Business Intelligence Analyst": "15-2051.01",
  "Operations Data Analyst": "15-2051.01",
  "Data Scientist": "15-2051.00",
  "AI QA Analyst": "15-1253.00",
  "Test Automation Analyst": "15-1253.00",
  "AI Evaluation Specialist": "15-1253.00",
  "Quality Engineering Analyst": "15-1253.00",
  "SDET Associate": "15-1253.00",
  "AI Business Analyst": "13-1111.00",
  "Systems Analyst": "15-1211.00",
  "AI Project Manager": "13-1121.00",
  "Technical Program Analyst": "13-1121.00",
  "AI Program Coordinator": "13-1121.00",
  "Implementation Project Manager": "13-1121.00",
  "Scrum Master / Agile Facilitator": "13-1121.00",
  "AI Product Manager": "13-1121.00",
  "Technical Product Manager": "13-1121.00",
  "Systems Administrator": "15-1244.00",
  "IT Support Lead": "15-1232.00",
  "Technical Support Specialist": "15-1232.00",
  "Customer Success Manager": "43-4051.00",
  "Product Designer": "15-1255.00",
  "UX Researcher": "15-1255.00",
  "Financial Analyst": "13-2011.00",
  "FP&A Analyst": "13-2011.00",
};
