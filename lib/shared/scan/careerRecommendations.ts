import type { CareerDirectionRecommendation, NormalizedScanInput } from "../types";
import {
  DESTINATION_ONET_CODES,
  occupationSimilarity,
  resolveLocalOccupation,
  sharedOccupationSkills,
} from "../onet/skillDistance";
import type { OnetOccupation } from "../onet/types";
import { formatRoleLabel } from "./inferTargetRole";
import {
  CATALOG_FAMILY_TO_REC,
  FAMILY_AFFINITY,
  NEXT_ROLE_DESTINATIONS,
  familyAffinity,
  type NextRoleDestination,
  type RecFamily,
} from "./nextRoleCatalog";
import { matchRole } from "./roleMatch";

export const TOP_CAREER_DIRECTIONS_INTRO =
  "These are realistic next roles based on your current experience, skills, and tools — ranked by how transferable your background is.";

export const NEXT_ROLES_COUNT = 5;

const CODING_SIGNAL =
  /\b(python|java|javascript|typescript|react|node|nodejs|golang|go\b|ruby|php|swift|kotlin|c\+\+|csharp|c#|rust|scala|apex|lwc|lightning|git|github|gitlab|debugging|programming|coding|software development|full.?stack|frontend|backend|devops|ci\/?cd|docker|kubernetes|api development)\b/i;

const ML_SIGNAL =
  /\b(machine learning|deep learning|ml engineer|data science|pytorch|tensorflow|scikit|nlp|llm|model training)\b/i;

const FALLBACK_SKILLS = ["Domain experience", "Core workflow skills", "Tool familiarity"] as const;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function overlapRatio(a: string, b: string): number {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;

  let intersect = 0;
  for (const token of left) {
    if (right.has(token)) intersect += 1;
  }

  return intersect / Math.max(left.size, right.size);
}

function profileText(input: NormalizedScanInput): string {
  return `${input.currentRole} ${input.skills} ${input.tools} ${input.industry}`;
}

function hasCodingSignals(input: NormalizedScanInput): boolean {
  return CODING_SIGNAL.test(profileText(input));
}

function hasMlSignals(input: NormalizedScanInput): boolean {
  return ML_SIGNAL.test(profileText(input));
}

/** Infer recommendation family from title/skills when catalog match is weak. */
function inferFamilyFromText(text: string): RecFamily {
  const t = text.toLowerCase();

  if (/salesforce|sfdc|agentforce|crm admin/.test(t)) return "salesforce";
  if (/cyber|infosec|information security|security analyst|security engineer|grc|soc\b|iam\b/.test(t)) {
    return "security";
  }
  if (/sysadmin|systems administrator|it support|help desk|network admin|desktop support/.test(t)) {
    return "it_operations";
  }
  if (/data scientist|machine learning|ml engineer|data analyst|bi analyst|analytics|database administrator|\bdba\b/.test(t)) {
    return "data_analytics";
  }
  if (/business analyst|systems analyst|functional analyst/.test(t) && !/data analyst/.test(t)) {
    return "business_strategy";
  }
  if (/qa analyst|quality assurance|test analyst|software tester|sdet/.test(t)) return "quality";
  if (/project manager|program manager|delivery manager|scrum master/.test(t) && !/product manager/.test(t)) {
    return "program_pm";
  }
  if (/product manager|product owner|technical writer/.test(t)) return "product";
  if (/revops|revenue operations|sales operations/.test(t)) return "revenue_ops";
  if (/customer success|customer support|csm\b/.test(t)) return "customer_success";
  if (/ux designer|ui designer|graphic designer|product designer/.test(t)) return "design";
  if (/marketing/.test(t)) return "marketing";
  if (/accountant|financial analyst|fp&a|finance/.test(t)) return "finance";
  if (/nurse|clinical|healthcare|hospital/.test(t)) return "healthcare";
  if (
    /developer|software engineer|programmer|devops|frontend|backend|full.?stack|cloud engineer|platform engineer|solutions architect/.test(
      t
    )
  ) {
    return "software_engineering";
  }

  return "operations";
}

export function resolveSourceFamily(input: NormalizedScanInput): RecFamily {
  const matched = matchRole({
    originalRoleInput: input.currentRole,
    industry: input.industry,
    yearsExperience: input.yearsExperience,
    skills: input.skills,
    tools: input.tools,
  });

  if (matched.roleFamily && CATALOG_FAMILY_TO_REC[matched.roleFamily]) {
    return CATALOG_FAMILY_TO_REC[matched.roleFamily];
  }

  return inferFamilyFromText(profileText(input));
}

function yearsRelevance(years: number): number {
  if (years >= 8) return 1;
  if (years >= 5) return 0.9;
  if (years >= 2) return 0.75;
  return 0.6;
}

function industryRelevance(input: NormalizedScanInput, keywords: string): number {
  if (input.industry === "General") return 0.55;
  const industryOverlap = overlapRatio(input.industry, keywords);
  return 0.65 + industryOverlap * 0.35;
}

function passesHardGates(input: NormalizedScanInput, candidate: NextRoleDestination): boolean {
  if (candidate.requiresCoding && !hasCodingSignals(input)) return false;
  if (candidate.requiresMl && !hasMlSignals(input)) return false;
  return true;
}

/**
 * Dynamic fit score: family affinity + profile overlap + O*NET skill distance.
 */
function scoreDestination(
  input: NormalizedScanInput,
  sourceFamily: RecFamily,
  candidate: NextRoleDestination,
  sourceOccupation: OnetOccupation | null
): number {
  const affinity = familyAffinity(sourceFamily, candidate.family);
  const skillOverlap = overlapRatio(input.skills, `${candidate.role} ${candidate.keywords}`);
  const toolOverlap = overlapRatio(input.tools, `${candidate.role} ${candidate.keywords}`);
  const titleOverlap = overlapRatio(input.currentRole, `${candidate.role} ${candidate.keywords}`);
  const industry = industryRelevance(input, candidate.keywords);
  const experience = yearsRelevance(input.yearsExperience);

  const destOccupation = resolveLocalOccupation(
    candidate.role,
    DESTINATION_ONET_CODES[candidate.role]
  );
  const onetSim =
    sourceOccupation && destOccupation ? occupationSimilarity(sourceOccupation, destOccupation) : null;

  const evidence =
    skillOverlap * 0.28 +
    toolOverlap * 0.18 +
    titleOverlap * 0.14 +
    industry * 0.08 +
    experience * 0.07 +
    affinity * 0.1 +
    (onetSim ?? affinity * 0.45) * 0.15;

  // Family prior is softer now — O*NET skill distance can reshuffle adjacent roles.
  const familyPrior = 42 + affinity * 30;
  const onetBoost = onetSim != null ? Math.round(onetSim * 26) : Math.round(affinity * 8);
  const evidenceBoost = Math.round((evidence - 0.35) * 28);

  return clampScore(familyPrior + onetBoost + evidenceBoost);
}

function pickTransferableSkills(
  input: NormalizedScanInput,
  candidate: NextRoleDestination,
  sourceOccupation: OnetOccupation | null
): [string, string, string] {
  const destOccupation = resolveLocalOccupation(
    candidate.role,
    DESTINATION_ONET_CODES[candidate.role]
  );

  const profileTokens = new Set(tokenize(profileText(input)));
  const scored = candidate.skillTags.map((tag) => {
    const tagTokens = tokenize(tag);
    const hits = tagTokens.filter(
      (t) => profileTokens.has(t) || [...profileTokens].some((p) => p.includes(t) || t.includes(p))
    );
    return { tag, score: hits.length / Math.max(tagTokens.length, 1) };
  });
  scored.sort((a, b) => b.score - a.score);

  const picked: string[] = [];

  // Prefer destination skill tags that appear in the user's profile.
  for (const item of scored) {
    if (picked.length >= 3) break;
    if (item.score > 0 && !picked.includes(item.tag)) picked.push(item.tag);
  }

  // Then shared O*NET skills (evidence of occupational transferability).
  if (sourceOccupation && destOccupation) {
    for (const skill of sharedOccupationSkills(sourceOccupation, destOccupation, 3)) {
      if (picked.length >= 3) break;
      if (!picked.includes(skill)) picked.push(skill);
    }
  }

  for (const tag of candidate.skillTags) {
    if (picked.length >= 3) break;
    if (!picked.includes(tag)) picked.push(tag);
  }

  while (picked.length < 3) {
    picked.push(FALLBACK_SKILLS[picked.length] ?? FALLBACK_SKILLS[0]);
  }

  return [picked[0]!, picked[1]!, picked[2]!];
}

function buildWhy(
  input: NormalizedScanInput,
  candidate: NextRoleDestination,
  sourceFamily: RecFamily,
  skills: string[]
): string {
  const affinity = familyAffinity(sourceFamily, candidate.family);
  const skillPhrase = skills.slice(0, 2).join(" and ").toLowerCase();

  if (affinity >= 0.85) {
    return `Your ${input.currentRole} background maps closely to this path — especially ${skillPhrase}.`;
  }
  if (affinity >= 0.55) {
    return `Adjacent experience from ${input.currentRole} transfers well here, particularly ${skillPhrase}.`;
  }
  return `Based on your skills and tools, ${skillPhrase} support a realistic move into this role.`;
}

export function transitionMonthsForFit(
  fitScore: number,
  yearsExperience: number
): { min: number; max: number; label: string } {
  if (fitScore >= 85) {
    return { min: 1, max: 3, label: "1–3 months" };
  }
  if (fitScore >= 70) {
    if (yearsExperience >= 3) return { min: 3, max: 6, label: "3–6 months" };
    return { min: 6, max: 9, label: "6–9 months" };
  }
  return { min: 6, max: 12, label: "6–12 months" };
}

function formatSalaryRange(min: number, max: number): string {
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  return `${fmt(min)}–${fmt(max)}`;
}

function enrichRecommendation(
  input: NormalizedScanInput,
  sourceFamily: RecFamily,
  candidate: NextRoleDestination,
  fitScore: number,
  sourceOccupation: OnetOccupation | null
): CareerDirectionRecommendation {
  const transferableSkills = pickTransferableSkills(input, candidate, sourceOccupation);
  const transition = transitionMonthsForFit(fitScore, input.yearsExperience);
  const avg = Math.round((candidate.salaryMin + candidate.salaryMax) / 2);

  return {
    role: candidate.role.trim(),
    transferabilityScore: fitScore,
    why: buildWhy(input, candidate, sourceFamily, transferableSkills),
    avgNationalSalaryUsd: avg,
    salaryRangeUsd: { min: candidate.salaryMin, max: candidate.salaryMax },
    salaryLabel: formatSalaryRange(candidate.salaryMin, candidate.salaryMax),
    transferableSkills: [...transferableSkills],
    transitionMonths: { min: transition.min, max: transition.max },
    transitionLabel: transition.label,
  };
}

/** Legacy scan payloads may still store plain role strings. */
export function normalizeCareerRecommendations(
  items: CareerDirectionRecommendation[] | string[] | undefined | null
): CareerDirectionRecommendation[] {
  if (!items?.length) return [];

  if (typeof items[0] === "string") {
    return (items as string[]).slice(0, NEXT_ROLES_COUNT).map((role, index) => {
      const fit = clampScore(84 - index * 3);
      const transition = transitionMonthsForFit(fit, 3);
      return {
        role: formatRoleLabel(role),
        transferabilityScore: fit,
        why: "Based on your current experience, skills, and tools, this path appears adjacent to your background.",
        avgNationalSalaryUsd: 90000,
        salaryRangeUsd: { min: 75000, max: 105000 },
        salaryLabel: "$75k–$105k",
        transferableSkills: ["Domain experience", "Core workflow skills", "Tool familiarity"],
        transitionMonths: { min: transition.min, max: transition.max },
        transitionLabel: transition.label,
      };
    });
  }

  return (items as CareerDirectionRecommendation[]).slice(0, NEXT_ROLES_COUNT).map((item) => {
    const fit = clampScore(item.transferabilityScore);
    const transition =
      item.transitionMonths && item.transitionLabel
        ? {
            min: item.transitionMonths.min,
            max: item.transitionMonths.max,
            label: item.transitionLabel,
          }
        : transitionMonthsForFit(fit, 3);

    return {
      role: item.role.trim(),
      transferabilityScore: fit,
      why: item.why,
      avgNationalSalaryUsd: item.avgNationalSalaryUsd ?? 90000,
      salaryRangeUsd: item.salaryRangeUsd ?? { min: 75000, max: 105000 },
      salaryLabel:
        item.salaryLabel ??
        formatSalaryRange(item.salaryRangeUsd?.min ?? 75000, item.salaryRangeUsd?.max ?? 105000),
      transferableSkills:
        item.transferableSkills?.slice(0, 3) ??
        (["Domain experience", "Core workflow skills", "Tool familiarity"] as string[]),
      transitionMonths: { min: transition.min, max: transition.max },
      transitionLabel: transition.label,
    };
  });
}

export function firstCareerRecommendationRole(
  items: CareerDirectionRecommendation[] | string[] | undefined | null,
  fallback: string
): string {
  const normalized = normalizeCareerRecommendations(items);
  return normalized[0]?.role ?? fallback;
}

/** Rank all destination roles dynamically from source family, profile overlap, and O*NET skill distance. */
export function buildRecommendations(input: NormalizedScanInput): CareerDirectionRecommendation[] {
  const sourceFamily = resolveSourceFamily(input);
  const sourceOccupation = resolveLocalOccupation(input.currentRole);
  const currentNorm = input.currentRole.trim().toLowerCase();

  const ranked = NEXT_ROLE_DESTINATIONS.filter(
    (candidate) => candidate.role.trim().toLowerCase() !== currentNorm
  )
    .filter((candidate) => passesHardGates(input, candidate))
    .filter((candidate) => familyAffinity(sourceFamily, candidate.family) >= 0.25 || sourceFamily === "operations")
    .map((candidate) => {
      const fit = scoreDestination(input, sourceFamily, candidate, sourceOccupation);
      return enrichRecommendation(input, sourceFamily, candidate, fit, sourceOccupation);
    })
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore);

  const top = ranked.slice(0, NEXT_ROLES_COUNT);
  if (top.length >= NEXT_ROLES_COUNT) return top;

  const extras = NEXT_ROLE_DESTINATIONS.filter(
    (candidate) =>
      candidate.family === "operations" &&
      !top.some((item) => item.role.toLowerCase() === candidate.role.toLowerCase())
  )
    .map((candidate) => {
      const fit = scoreDestination(input, sourceFamily, candidate, sourceOccupation);
      return enrichRecommendation(input, sourceFamily, candidate, fit, sourceOccupation);
    })
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore);

  return [...top, ...extras]
    .filter(
      (item, index, all) =>
        all.findIndex((other) => other.role.toLowerCase() === item.role.toLowerCase()) === index
    )
    .slice(0, NEXT_ROLES_COUNT);
}

export { FAMILY_AFFINITY, NEXT_ROLE_DESTINATIONS, type RecFamily };
