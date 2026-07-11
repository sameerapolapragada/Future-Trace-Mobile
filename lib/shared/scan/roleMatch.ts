import { formatRoleLabel } from "./inferTargetRole";
import { normalizeRoleText, roleStringSimilarity } from "./roleCanonicalization";
import { isSupportedIndustry } from "./technologyDomain";

export type MatchStatus = "matched" | "partial_match" | "unsupported" | "no_match";
export type ConfidenceLabel = "excellent" | "high" | "medium" | "low" | "none";
export type AnalysisQuality = "high" | "medium" | "low" | "none";
export type RoleMatchUserAction =
  | "auto_accepted"
  | "confirmed"
  | "corrected"
  | "rejected"
  | "needs_more_info"
  | "approximate_continue"
  | "abandoned";

export type SuggestedRole = {
  role: string;
  confidence: number;
};

export type RoleMatchInput = {
  originalRoleInput: string;
  industry?: string;
  yearsExperience?: number;
  skills?: string;
  tools?: string;
  responsibilities?: string;
};

export type RoleMatchResult = {
  roleMatchEventId?: string;
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
  /** True when industry or matched role is outside the technology MVP scope. */
  outOfTechnologyDomain?: boolean;
};

type CatalogEntry = {
  canonical: string;
  family: string;
  aliases: string[];
  supported: boolean;
  technologyDomain: boolean;
};

const ROLE_CATALOG: CatalogEntry[] = [
  {
    canonical: "Salesforce Administrator",
    family: "Salesforce",
    aliases: [
      "salesforce admin",
      "salesforce administrator",
      "sales force administrator",
      "sf admin",
      "sfdc admin",
      "salesforce platform administrator",
    ],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Salesforce Solution Architect",
    family: "Salesforce",
    aliases: [
      "salesforce solution architect",
      "salesforce architect",
      "sfdc solution architect",
      "salesforce technical architect",
      "salesforce revenue cloud solution architect",
      "senior salesforce solution architect",
    ],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Salesforce Consultant",
    family: "Salesforce",
    aliases: ["salesforce consultant", "sfdc consultant", "salesforce implementation consultant"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Salesforce Business Analyst",
    family: "Salesforce",
    aliases: ["salesforce business analyst", "salesforce ba", "sfdc business analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Business Analyst",
    family: "Business & Strategy",
    aliases: ["business analyst", "systems analyst", "functional analyst", "it business analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Data Analyst",
    family: "Data & Analytics",
    aliases: ["data analyst", "analytics analyst", "bi analyst", "business intelligence analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "QA Analyst",
    family: "Quality & Testing",
    aliases: ["qa analyst", "quality assurance analyst", "software tester", "test analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Project Manager",
    family: "Program & Project Management",
    aliases: ["project manager", "program manager", "programme manager"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Product Manager",
    family: "Product",
    aliases: ["product manager", "product owner"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Software Developer",
    family: "Software Engineering",
    aliases: ["software developer", "software engineer", "programmer", "application developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "RevOps Analyst",
    family: "Revenue Operations",
    aliases: ["revops analyst", "revenue operations analyst", "rev ops analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Customer Support Specialist",
    family: "Customer Success",
    aliases: ["customer support specialist", "customer support", "support specialist", "help desk"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Marketing Manager",
    family: "Marketing",
    aliases: ["marketing manager", "digital marketing manager"],
    supported: true,
    technologyDomain: false,
  },
  {
    canonical: "Accountant",
    family: "Finance",
    aliases: ["accountant", "accountant and auditor", "cpa"],
    supported: true,
    technologyDomain: false,
  },
  {
    canonical: "Registered Nurse",
    family: "Healthcare",
    aliases: [
      "registered nurse",
      "nurse",
      "nursing",
      "rn",
      "r.n.",
      "staff nurse",
      "clinical nurse",
      "charge nurse",
      "er nurse",
      "icu nurse",
    ],
    supported: true,
    technologyDomain: false,
  },
  {
    canonical: "Graphic Designer",
    family: "Design",
    aliases: ["graphic designer", "visual designer"],
    supported: true,
    technologyDomain: false,
  },
  {
    canonical: "UX Designer",
    family: "Design",
    aliases: ["ux designer", "ui designer", "ui/ux designer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "DevOps Engineer",
    family: "Software Engineering",
    aliases: ["devops engineer", "dev ops engineer", "site reliability engineer", "sre"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Data Scientist",
    family: "Data & Analytics",
    aliases: ["data scientist", "machine learning engineer", "ml engineer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Salesforce Developer",
    family: "Salesforce",
    aliases: ["salesforce developer", "sfdc developer", "apex developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Frontend Developer",
    family: "Software Engineering",
    aliases: ["frontend developer", "front end developer", "front-end developer", "ui developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Backend Developer",
    family: "Software Engineering",
    aliases: ["backend developer", "back end developer", "back-end developer", "api developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Full Stack Developer",
    family: "Software Engineering",
    aliases: ["full stack developer", "fullstack developer", "full-stack developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Mobile Developer",
    family: "Software Engineering",
    aliases: ["mobile developer", "ios developer", "android developer", "mobile app developer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Cloud Engineer",
    family: "Software Engineering",
    aliases: ["cloud engineer", "aws engineer", "azure engineer", "gcp engineer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Platform Engineer",
    family: "Software Engineering",
    aliases: ["platform engineer", "developer platform engineer"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Cybersecurity Analyst",
    family: "Security",
    aliases: ["cybersecurity analyst", "security analyst", "information security analyst", "infosec analyst"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Systems Administrator",
    family: "IT Operations",
    aliases: ["systems administrator", "system administrator", "sysadmin", "sys admin"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "IT Support Specialist",
    family: "IT Operations",
    aliases: ["it support specialist", "it support", "desktop support", "technical support specialist"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Database Administrator",
    family: "Data & Analytics",
    aliases: ["database administrator", "dba", "sql dba"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Solutions Architect",
    family: "Software Engineering",
    aliases: ["solutions architect", "solution architect", "enterprise solutions architect"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Scrum Master",
    family: "Program & Project Management",
    aliases: ["scrum master", "agile scrum master"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Customer Success Manager",
    family: "Customer Success",
    aliases: ["customer success manager", "csm", "customer success lead"],
    supported: true,
    technologyDomain: true,
  },
  {
    canonical: "Technical Writer",
    family: "Product",
    aliases: ["technical writer", "tech writer", "documentation specialist"],
    supported: true,
    technologyDomain: true,
  },
];

const UNSUPPORTED_BUT_REAL_PATTERNS = [
  "agentforce",
  "prompt engineer",
  "ai engineer",
  "llm engineer",
  "automation specialist",
];

/** Curated technology roles shown in the MVP current-role picker (A–Z). */
export const TECHNOLOGY_CURRENT_ROLES: string[] = ROLE_CATALOG.filter(
  (entry) => entry.supported && entry.technologyDomain
)
  .map((entry) => formatRoleLabel(entry.canonical))
  .sort((a, b) => a.localeCompare(b));

/** Sentinel picklist value for roles not in the curated catalog. */
export const OTHER_ROLE_OPTION = "Other";

export function isOtherRoleSelection(role: string): boolean {
  return role.trim().toLowerCase() === OTHER_ROLE_OPTION.toLowerCase();
}

/** Filter curated roles by typed query; results stay alphabetical, with Other last. */
export function filterTechnologyCurrentRoles(
  query: string,
  roles: readonly string[] = TECHNOLOGY_CURRENT_ROLES,
  limit = 8
): string[] {
  const normalized = query.trim().toLowerCase();
  const source = [...roles].sort((a, b) => a.localeCompare(b));
  const matches = (
    normalized ? source.filter((role) => role.toLowerCase().includes(normalized)) : source
  ).slice(0, limit);

  return [...matches.filter((role) => !isOtherRoleSelection(role)), OTHER_ROLE_OPTION];
}

export function isTechnologyCurrentRole(role: string, roles: readonly string[] = TECHNOLOGY_CURRENT_ROLES): boolean {
  if (isOtherRoleSelection(role)) return false;
  const normalized = role.trim().toLowerCase();
  return roles.some((entry) => entry.toLowerCase() === normalized);
}

/** Effective role string used for matching / scan generation. */
export function resolveScanFormRoleInput(input: {
  currentRole: string;
  otherRoleName?: string;
}): string {
  if (isOtherRoleSelection(input.currentRole)) {
    return (input.otherRoleName ?? "").trim();
  }
  return input.currentRole.trim();
}

function scoreToPercent(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score * 100)));
}

export function normalizeRoleInputForTracking(raw: string): string {
  return normalizeRoleText(raw);
}

export function confidenceLabelFromScore(scorePercent: number): ConfidenceLabel {
  if (scorePercent >= 90) return "excellent";
  if (scorePercent >= 75) return "high";
  if (scorePercent >= 50) return "medium";
  if (scorePercent >= 31) return "low";
  return "none";
}

function analysisQualityFromStatus(status: MatchStatus, label: ConfidenceLabel): AnalysisQuality {
  if (status === "no_match") return "none";
  if (status === "unsupported") return "low";
  if (status === "partial_match") return "medium";
  if (label === "excellent" || label === "high") return "high";
  return "medium";
}

function isLikelyNonsense(normalized: string, scorePercent: number): boolean {
  if (!normalized) return true;
  if (normalized.length < 3) return true;
  if (scorePercent <= 30 && normalized.split(" ").length <= 2) return true;

  const vowelRatio =
    normalized.replace(/[^aeiou]/g, "").length / Math.max(normalized.replace(/\s/g, "").length, 1);
  if (scorePercent <= 20 && vowelRatio < 0.15) return true;

  return false;
}

function looksLikeUnsupportedRealRole(normalized: string): boolean {
  return UNSUPPORTED_BUT_REAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

type CandidateMatch = {
  canonical: string;
  family: string;
  supported: boolean;
  technologyDomain: boolean;
  score: number;
};

function findCandidates(raw: string): CandidateMatch[] {
  const trimmed = raw.trim();
  const results: CandidateMatch[] = [];

  for (const entry of ROLE_CATALOG) {
    const forms = [entry.canonical, ...entry.aliases];
    let bestScore = 0;
    for (const form of forms) {
      bestScore = Math.max(bestScore, roleStringSimilarity(trimmed, form));
    }
    results.push({
      canonical: formatRoleLabel(entry.canonical),
      family: entry.family,
      supported: entry.supported,
      technologyDomain: entry.technologyDomain,
      score: bestScore,
    });
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

function outOfDomainResult(
  originalRoleInput: string,
  scorePercent: number,
  family: string | null
): RoleMatchResult {
  return {
    originalRoleInput,
    normalizedRole: null,
    roleFamily: family,
    matchStatus: "no_match",
    confidenceScore: scorePercent,
    confidenceLabel: "none",
    suggestedRoles: [],
    needsMoreInfo: true,
    analysisQuality: "none",
    genericResultFlag: true,
    outOfTechnologyDomain: true,
  };
}

/** Core role matching — used by mobile (offline), web, and edge function. */
export function matchRole(input: RoleMatchInput): RoleMatchResult {
  const originalRoleInput = input.originalRoleInput.trim();
  const normalizedTracking = normalizeRoleInputForTracking(originalRoleInput);

  if (!originalRoleInput) {
    return {
      originalRoleInput,
      normalizedRole: null,
      roleFamily: null,
      matchStatus: "no_match",
      confidenceScore: 0,
      confidenceLabel: "none",
      suggestedRoles: [],
      needsMoreInfo: true,
      analysisQuality: "none",
      genericResultFlag: true,
    };
  }

  if (input.industry != null && input.industry.trim() && !isSupportedIndustry(input.industry)) {
    return outOfDomainResult(originalRoleInput, 0, null);
  }

  const candidates = findCandidates(originalRoleInput);
  const best = candidates[0];
  const scorePercent = best ? scoreToPercent(best.score) : 0;
  const confidenceLabel = confidenceLabelFromScore(scorePercent);
  const suggestedRoles = buildSuggestedRoles(candidates);

  if (isLikelyNonsense(normalizedTracking, scorePercent)) {
    return {
      originalRoleInput,
      normalizedRole: null,
      roleFamily: null,
      matchStatus: "no_match",
      confidenceScore: scorePercent,
      confidenceLabel: "none",
      suggestedRoles,
      needsMoreInfo: true,
      analysisQuality: "none",
      genericResultFlag: true,
    };
  }

  // Any credible non-tech match (same floor as "unsupported") must stop here —
  // e.g. "nurse" scores ~48% vs "Registered Nurse" and used to slip into Needs Info.
  if (best && scorePercent >= 31 && !best.technologyDomain) {
    return outOfDomainResult(originalRoleInput, scorePercent, best.family);
  }

  if (scorePercent >= 90 && best) {
    return {
      originalRoleInput,
      normalizedRole: best.canonical,
      roleFamily: best.family,
      matchStatus: "matched",
      confidenceScore: scorePercent,
      confidenceLabel,
      suggestedRoles,
      needsMoreInfo: false,
      analysisQuality: analysisQualityFromStatus("matched", confidenceLabel),
      genericResultFlag: false,
    };
  }

  if (scorePercent >= 70 && best) {
    return {
      originalRoleInput,
      normalizedRole: best.canonical,
      roleFamily: best.family,
      matchStatus: "partial_match",
      confidenceScore: scorePercent,
      confidenceLabel,
      suggestedRoles,
      needsMoreInfo: false,
      analysisQuality: "medium",
      genericResultFlag: false,
    };
  }

  const topSuggestion = suggestedRoles[0];
  const approximateRole = topSuggestion && topSuggestion.confidence >= 40 ? topSuggestion.role : null;
  const suggestedFamily = best?.family ?? null;

  if (looksLikeUnsupportedRealRole(normalizedTracking) || scorePercent >= 31) {
    return {
      originalRoleInput,
      normalizedRole: approximateRole,
      roleFamily: suggestedFamily,
      matchStatus: "unsupported",
      confidenceScore: scorePercent,
      confidenceLabel,
      suggestedRoles,
      needsMoreInfo: true,
      analysisQuality: "low",
      genericResultFlag: !approximateRole,
    };
  }

  return {
    originalRoleInput,
    normalizedRole: null,
    roleFamily: null,
    matchStatus: "no_match",
    confidenceScore: scorePercent,
    confidenceLabel: "none",
    suggestedRoles,
    needsMoreInfo: true,
    analysisQuality: "none",
    genericResultFlag: true,
  };
}

export function canGenerateScan(match: RoleMatchResult, userAction?: RoleMatchUserAction): boolean {
  if (match.outOfTechnologyDomain) return false;
  if (match.matchStatus === "no_match") return false;
  if (match.matchStatus === "matched") return true;
  if (match.matchStatus === "partial_match") {
    return userAction === "confirmed" || userAction === "corrected" || userAction === "auto_accepted";
  }
  if (match.matchStatus === "unsupported") {
    return userAction === "approximate_continue" && !!match.normalizedRole;
  }
  return false;
}

export function formatRoleMatchQualityLabel(
  matchStatus: MatchStatus,
  userAction?: RoleMatchUserAction
): string {
  if (userAction === "approximate_continue") return "Approximate Match";
  if (matchStatus === "matched" && (userAction === "confirmed" || userAction === "auto_accepted")) {
    return userAction === "auto_accepted" ? "Excellent Match" : "Confirmed Match";
  }
  if (matchStatus === "partial_match") return "Confirmed Match";
  if (matchStatus === "matched") return "Excellent Match";
  return "Limited Match";
}

export function shouldTrackUnknownRole(matchStatus: MatchStatus): boolean {
  return matchStatus === "unsupported" || matchStatus === "no_match";
}
