/** Deno edge-function copy of lib/shared/scan/roleMatch.ts — keep in sync. */

function formatRoleLabel(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "salesforce") return "Salesforce";
      if (lower === "revops") return "RevOps";
      if (lower === "devops") return "DevOps";
      if (lower.length <= 3) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function normalizeRoleText(raw: string): string {
  let text = raw.trim().toLowerCase();
  text = text.replace(/[^a-z0-9\s/+-]/g, " ");
  text = text.replace(/\bsf\b/g, "salesforce");
  text = text.replace(/\bsfdc\b/g, "salesforce");
  return text.replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i += 1) matrix[i]![0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(matrix[i - 1]![j]! + 1, matrix[i]![j - 1]! + 1, matrix[i - 1]![j - 1]! + cost);
    }
  }
  return matrix[a.length]![b.length]!;
}

function roleStringSimilarity(a: string, b: string): number {
  const left = normalizeRoleText(a);
  const right = normalizeRoleText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLen = Math.max(left.length, right.length);
  const charSimilarity = 1 - levenshtein(left, right) / maxLen;
  const leftTokens = new Set(left.split(" ").filter((t) => t.length > 1));
  const rightTokens = new Set(right.split(" ").filter((t) => t.length > 1));
  let intersect = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersect += 1;
  }
  const tokens = intersect / Math.max(leftTokens.size, rightTokens.size, 1);
  if (charSimilarity >= 0.88) return charSimilarity;
  return charSimilarity * 0.55 + tokens * 0.45;
}

export type MatchStatus = "matched" | "partial_match" | "unsupported" | "no_match";
export type ConfidenceLabel = "excellent" | "high" | "medium" | "low" | "none";
export type AnalysisQuality = "high" | "medium" | "low" | "none";

export type SuggestedRole = { role: string; confidence: number };

export type RoleMatchInput = {
  originalRoleInput: string;
  industry?: string;
  yearsExperience?: number;
  skills?: string;
  tools?: string;
  responsibilities?: string;
};

export type RoleMatchResult = {
  originalRoleInput: string;
  normalizedRole: string | null;
  roleFamily: string | null;
  matchStatus: MatchStatus;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  suggestedRoles: SuggestedRole[];
  needsMoreInfo: boolean;
  analysisQuality: AnalysisQuality;
  genericResultFlag: boolean;
  outOfTechnologyDomain?: boolean;
};

type CatalogEntry = {
  canonical: string;
  family: string;
  aliases: string[];
  supported: boolean;
  technologyDomain: boolean;
};

const SUPPORTED_INDUSTRIES = [
  "Consulting",
  "Education",
  "Financial Services",
  "Government",
  "Healthcare",
  "Manufacturing",
  "Media & Entertainment",
  "Retail & E-commerce",
  "SaaS",
  "Technology",
];

function isTechnologyDomain(industry: string): boolean {
  const trimmed = industry.trim();
  if (!trimmed) return true;
  return SUPPORTED_INDUSTRIES.some((entry) => entry.toLowerCase() === trimmed.toLowerCase());
}

const ROLE_CATALOG: CatalogEntry[] = [
  { canonical: "Salesforce Administrator", family: "Salesforce", aliases: ["salesforce admin", "salesforce administrator", "sf admin", "sfdc admin"], supported: true, technologyDomain: true },
  { canonical: "Salesforce Solution Architect", family: "Salesforce", aliases: ["salesforce solution architect", "salesforce architect", "salesforce revenue cloud solution architect", "senior salesforce solution architect"], supported: true, technologyDomain: true },
  { canonical: "Salesforce Consultant", family: "Salesforce", aliases: ["salesforce consultant", "sfdc consultant"], supported: true, technologyDomain: true },
  { canonical: "Salesforce Business Analyst", family: "Salesforce", aliases: ["salesforce business analyst", "salesforce ba"], supported: true, technologyDomain: true },
  { canonical: "Business Analyst", family: "Business & Strategy", aliases: ["business analyst", "systems analyst"], supported: true, technologyDomain: true },
  { canonical: "Data Analyst", family: "Data & Analytics", aliases: ["data analyst", "analytics analyst", "bi analyst"], supported: true, technologyDomain: true },
  { canonical: "QA Analyst", family: "Quality & Testing", aliases: ["qa analyst", "quality assurance analyst", "software tester"], supported: true, technologyDomain: true },
  { canonical: "Project Manager", family: "Program & Project Management", aliases: ["project manager", "program manager"], supported: true, technologyDomain: true },
  { canonical: "Product Manager", family: "Product", aliases: ["product manager", "product owner"], supported: true, technologyDomain: true },
  { canonical: "Software Developer", family: "Software Engineering", aliases: ["software developer", "software engineer", "programmer"], supported: true, technologyDomain: true },
  { canonical: "RevOps Analyst", family: "Revenue Operations", aliases: ["revops analyst", "revenue operations analyst"], supported: true, technologyDomain: true },
  { canonical: "Customer Support Specialist", family: "Customer Success", aliases: ["customer support specialist", "customer support"], supported: true, technologyDomain: true },
  { canonical: "Marketing Manager", family: "Marketing", aliases: ["marketing manager"], supported: true, technologyDomain: false },
  { canonical: "Accountant", family: "Finance", aliases: ["accountant", "cpa"], supported: true, technologyDomain: false },
  { canonical: "Registered Nurse", family: "Healthcare", aliases: ["registered nurse", "nurse", "nursing", "rn", "staff nurse", "clinical nurse", "charge nurse"], supported: true, technologyDomain: false },
  { canonical: "Graphic Designer", family: "Design", aliases: ["graphic designer"], supported: true, technologyDomain: false },
  { canonical: "UX Designer", family: "Design", aliases: ["ux designer", "ui designer"], supported: true, technologyDomain: true },
  { canonical: "DevOps Engineer", family: "Software Engineering", aliases: ["devops engineer", "sre"], supported: true, technologyDomain: true },
  { canonical: "Data Scientist", family: "Data & Analytics", aliases: ["data scientist", "ml engineer"], supported: true, technologyDomain: true },
  { canonical: "Salesforce Developer", family: "Salesforce", aliases: ["salesforce developer", "sfdc developer", "apex developer"], supported: true, technologyDomain: true },
  { canonical: "Frontend Developer", family: "Software Engineering", aliases: ["frontend developer", "front end developer", "ui developer"], supported: true, technologyDomain: true },
  { canonical: "Backend Developer", family: "Software Engineering", aliases: ["backend developer", "back end developer", "api developer"], supported: true, technologyDomain: true },
  { canonical: "Full Stack Developer", family: "Software Engineering", aliases: ["full stack developer", "fullstack developer"], supported: true, technologyDomain: true },
  { canonical: "Mobile Developer", family: "Software Engineering", aliases: ["mobile developer", "ios developer", "android developer"], supported: true, technologyDomain: true },
  { canonical: "Cloud Engineer", family: "Software Engineering", aliases: ["cloud engineer", "aws engineer", "azure engineer"], supported: true, technologyDomain: true },
  { canonical: "Platform Engineer", family: "Software Engineering", aliases: ["platform engineer"], supported: true, technologyDomain: true },
  { canonical: "Cybersecurity Analyst", family: "Security", aliases: ["cybersecurity analyst", "security analyst", "infosec analyst"], supported: true, technologyDomain: true },
  { canonical: "Systems Administrator", family: "IT Operations", aliases: ["systems administrator", "system administrator", "sysadmin"], supported: true, technologyDomain: true },
  { canonical: "IT Support Specialist", family: "IT Operations", aliases: ["it support specialist", "it support", "desktop support"], supported: true, technologyDomain: true },
  { canonical: "Database Administrator", family: "Data & Analytics", aliases: ["database administrator", "dba"], supported: true, technologyDomain: true },
  { canonical: "Solutions Architect", family: "Software Engineering", aliases: ["solutions architect", "solution architect"], supported: true, technologyDomain: true },
  { canonical: "Scrum Master", family: "Program & Project Management", aliases: ["scrum master"], supported: true, technologyDomain: true },
  { canonical: "Customer Success Manager", family: "Customer Success", aliases: ["customer success manager", "csm"], supported: true, technologyDomain: true },
  { canonical: "Technical Writer", family: "Product", aliases: ["technical writer", "tech writer"], supported: true, technologyDomain: true },
];

const UNSUPPORTED_BUT_REAL_PATTERNS = ["agentforce", "prompt engineer", "ai engineer", "llm engineer"];

function scoreToPercent(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score * 100)));
}

export function normalizeRoleInputForTracking(raw: string): string {
  return normalizeRoleText(raw);
}

function confidenceLabelFromScore(scorePercent: number): ConfidenceLabel {
  if (scorePercent >= 90) return "excellent";
  if (scorePercent >= 75) return "high";
  if (scorePercent >= 50) return "medium";
  if (scorePercent >= 31) return "low";
  return "none";
}

function isLikelyNonsense(normalized: string, scorePercent: number): boolean {
  if (!normalized || normalized.length < 3) return true;
  if (scorePercent <= 30 && normalized.split(" ").length <= 2) return true;
  const vowelRatio = normalized.replace(/[^aeiou]/g, "").length / Math.max(normalized.replace(/\s/g, "").length, 1);
  if (scorePercent <= 20 && vowelRatio < 0.15) return true;
  return false;
}

function looksLikeUnsupportedRealRole(normalized: string): boolean {
  return UNSUPPORTED_BUT_REAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

type CandidateMatch = { canonical: string; family: string; supported: boolean; technologyDomain: boolean; score: number };

function findCandidates(raw: string): CandidateMatch[] {
  const trimmed = raw.trim();
  const results: CandidateMatch[] = [];
  for (const entry of ROLE_CATALOG) {
    const forms = [entry.canonical, ...entry.aliases];
    let bestScore = 0;
    for (const form of forms) {
      bestScore = Math.max(bestScore, roleStringSimilarity(trimmed, form));
    }
    results.push({ canonical: formatRoleLabel(entry.canonical), family: entry.family, supported: entry.supported, technologyDomain: entry.technologyDomain, score: bestScore });
  }
  return results.sort((a, b) => b.score - a.score);
}

function buildSuggestedRoles(candidates: CandidateMatch[], limit = 3): SuggestedRole[] {
  const seen = new Set<string>();
  const out: SuggestedRole[] = [];
  for (const candidate of candidates) {
    if (!candidate.supported || !candidate.technologyDomain || candidate.score < 0.35) continue;
    if (seen.has(candidate.canonical)) continue;
    seen.add(candidate.canonical);
    out.push({ role: candidate.canonical, confidence: scoreToPercent(candidate.score) });
    if (out.length >= limit) break;
  }
  return out;
}

export function matchRole(input: RoleMatchInput): RoleMatchResult {
  const originalRoleInput = input.originalRoleInput.trim();
  const normalizedTracking = normalizeRoleInputForTracking(originalRoleInput);

  if (!originalRoleInput) {
    return { originalRoleInput, normalizedRole: null, roleFamily: null, matchStatus: "no_match", confidenceScore: 0, confidenceLabel: "none", suggestedRoles: [], needsMoreInfo: true, analysisQuality: "none", genericResultFlag: true };
  }

  if (input.industry != null && input.industry.trim() && !isTechnologyDomain(input.industry)) {
    return { originalRoleInput, normalizedRole: null, roleFamily: null, matchStatus: "no_match", confidenceScore: 0, confidenceLabel: "none", suggestedRoles: [], needsMoreInfo: true, analysisQuality: "none", genericResultFlag: true, outOfTechnologyDomain: true };
  }

  const candidates = findCandidates(originalRoleInput);
  const best = candidates[0];
  const scorePercent = best ? scoreToPercent(best.score) : 0;
  const confidenceLabel = confidenceLabelFromScore(scorePercent);
  const suggestedRoles = buildSuggestedRoles(candidates);

  if (isLikelyNonsense(normalizedTracking, scorePercent)) {
    return { originalRoleInput, normalizedRole: null, roleFamily: null, matchStatus: "no_match", confidenceScore: scorePercent, confidenceLabel: "none", suggestedRoles, needsMoreInfo: true, analysisQuality: "none", genericResultFlag: true };
  }

  if (best && scorePercent >= 31 && !best.technologyDomain) {
    return { originalRoleInput, normalizedRole: null, roleFamily: best.family, matchStatus: "no_match", confidenceScore: scorePercent, confidenceLabel: "none", suggestedRoles: [], needsMoreInfo: true, analysisQuality: "none", genericResultFlag: true, outOfTechnologyDomain: true };
  }

  if (scorePercent >= 90 && best) {
    return { originalRoleInput, normalizedRole: best.canonical, roleFamily: best.family, matchStatus: "matched", confidenceScore: scorePercent, confidenceLabel, suggestedRoles, needsMoreInfo: false, analysisQuality: "high", genericResultFlag: false };
  }

  if (scorePercent >= 70 && best) {
    return { originalRoleInput, normalizedRole: best.canonical, roleFamily: best.family, matchStatus: "partial_match", confidenceScore: scorePercent, confidenceLabel, suggestedRoles, needsMoreInfo: false, analysisQuality: "medium", genericResultFlag: false };
  }

  const topSuggestion = suggestedRoles[0];
  const approximateRole = topSuggestion && topSuggestion.confidence >= 40 ? topSuggestion.role : null;
  const suggestedFamily = best?.family ?? null;

  if (looksLikeUnsupportedRealRole(normalizedTracking) || scorePercent >= 31) {
    return { originalRoleInput, normalizedRole: approximateRole, roleFamily: suggestedFamily, matchStatus: "unsupported", confidenceScore: scorePercent, confidenceLabel, suggestedRoles, needsMoreInfo: true, analysisQuality: "low", genericResultFlag: !approximateRole };
  }

  return { originalRoleInput, normalizedRole: null, roleFamily: null, matchStatus: "no_match", confidenceScore: scorePercent, confidenceLabel: "none", suggestedRoles, needsMoreInfo: true, analysisQuality: "none", genericResultFlag: true };
}

export function shouldTrackUnknownRole(matchStatus: MatchStatus): boolean {
  return matchStatus === "unsupported" || matchStatus === "no_match";
}
