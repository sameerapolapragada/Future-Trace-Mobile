import { LOCAL_ONET_INDEX } from "../onet/localIndex";
import { formatRoleLabel } from "./inferTargetRole";

export const ROLE_MATCH_CONFIDENCE_THRESHOLD = 0.85;

type CuratedRoleEntry = {
  canonical: string;
  aliases: string[];
};

type RoleCandidate = {
  canonical: string;
  priority: number;
};

/** High-priority curated roles override broader occupational matches. */
const CURATED_ROLE_CATALOG: CuratedRoleEntry[] = [
  {
    canonical: "Salesforce Administrator",
    aliases: [
      "salesforce admin",
      "salesforce administrator",
      "sales force administrator",
      "sales force admin",
      "sf admin",
      "sfdc admin",
      "salesforce administrater",
      "salesforce administrtor",
      "salesforce administrato",
      "salesforce administratior",
      "salesforce platform administrator",
    ],
  },
  {
    canonical: "Salesforce Business Analyst",
    aliases: ["salesforce business analyst", "salesforce ba", "sfdc business analyst"],
  },
  {
    canonical: "Business Analyst",
    aliases: [
      "business analyst",
      "systems analyst",
      "functional analyst",
      "it business analyst",
      "busines analyst",
      "business analist",
    ],
  },
  {
    canonical: "Data Analyst",
    aliases: [
      "data analyst",
      "analytics analyst",
      "bi analyst",
      "business intelligence analyst",
      "data analist",
      "data anlyst",
    ],
  },
  {
    canonical: "QA Analyst",
    aliases: [
      "qa analyst",
      "quality assurance analyst",
      "software tester",
      "test analyst",
      "qa engineer",
      "quality analyst",
    ],
  },
  {
    canonical: "Project Manager",
    aliases: ["project manager", "projct manager", "project manger"],
  },
  {
    canonical: "Program Manager",
    aliases: ["program manager", "programme manager"],
  },
  {
    canonical: "Product Manager",
    aliases: ["product manager", "product owner", "product manger"],
  },
  {
    canonical: "Software Developer",
    aliases: [
      "software developer",
      "software engineer",
      "software develper",
      "software enginer",
      "programmer",
      "application developer",
    ],
  },
  {
    canonical: "RevOps Analyst",
    aliases: ["revops analyst", "revenue operations analyst", "rev ops analyst"],
  },
  {
    canonical: "Customer Support Specialist",
    aliases: [
      "customer support specialist",
      "customer support",
      "support specialist",
      "help desk",
      "service desk analyst",
    ],
  },
  {
    canonical: "Marketing Manager",
    aliases: ["marketing manager", "markting manager", "digital marketing manager"],
  },
  {
    canonical: "Accountant",
    aliases: ["accountant", "accountant and auditor", "cpa"],
  },
  {
    canonical: "Registered Nurse",
    aliases: ["registered nurse", "rn", "staff nurse", "clinical nurse"],
  },
  {
    canonical: "Graphic Designer",
    aliases: ["graphic designer", "visual designer", "grahic designer"],
  },
  {
    canonical: "UX Designer",
    aliases: ["ux designer", "ui designer", "ui/ux designer"],
  },
  {
    canonical: "DevOps Engineer",
    aliases: ["devops engineer", "dev ops engineer", "site reliability engineer", "sre"],
  },
  {
    canonical: "Data Scientist",
    aliases: ["data scientist", "data scientst", "machine learning engineer", "ml engineer"],
  },
];

const RECOMMENDATION_ROLE_NAMES = [
  "Salesforce AI Administrator",
  "Agentforce Specialist",
  "Salesforce Automation Consultant",
  "AI Business Analyst",
  "Product Operations Analyst",
  "Process Automation Analyst",
  "AI Data Analyst",
  "Analytics Engineer",
  "BI Automation Analyst",
  "AI QA Analyst",
  "Test Automation Analyst",
  "AI Evaluation Specialist",
  "AI Project Manager",
  "Technical Program Analyst",
  "AI Program Coordinator",
  "AI-Assisted Software Developer",
  "Integration Developer",
  "Platform Support Engineer",
  "Operations Analyst",
  "Process Improvement Specialist",
  "AI Workflow Coordinator",
];

const ABBREVIATION_REPLACEMENTS: [RegExp, string][] = [
  [/\bsf\b/g, "salesforce"],
  [/\bsfdc\b/g, "salesforce"],
  [/\bsales force\b/g, "salesforce"],
  [/\bqa\b/g, "quality assurance"],
  [/\bbi\b/g, "business intelligence"],
  [/\bhr\b/g, "human resources"],
  [/\bux\b/g, "user experience"],
  [/\bui\b/g, "user interface"],
  [/\bsre\b/g, "site reliability engineer"],
  [/\brn\b/g, "registered nurse"],
  [/\bcpa\b/g, "certified public accountant"],
];

function singularizeLastWord(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length === 0) return title;

  const last = words[words.length - 1]!;
  let singular = last;

  if (/ies$/i.test(last) && last.length > 4) {
    singular = `${last.slice(0, -3)}y`;
  } else if (/ses$/i.test(last) && last.length > 4) {
    singular = last.slice(0, -2);
  } else if (/s$/i.test(last) && !/ss$/i.test(last) && last.length > 3) {
    singular = last.slice(0, -1);
  }

  words[words.length - 1] = singular;
  return words.join(" ");
}

function addCandidate(
  fuzzyCandidates: RoleCandidate[],
  directLookup: Map<string, RoleCandidate>,
  canonical: string,
  priority: number,
  aliases: string[] = []
): void {
  const formatted = formatRoleLabel(canonical);
  const entry: RoleCandidate = { canonical: formatted, priority };

  if (!fuzzyCandidates.some((item) => item.canonical === formatted)) {
    fuzzyCandidates.push(entry);
  }

  const setIfBetter = (rawKey: string) => {
    const key = normalizeRoleText(rawKey);
    if (!key) return;
    const existing = directLookup.get(key);
    if (!existing || priority > existing.priority) {
      directLookup.set(key, entry);
    }
  };

  setIfBetter(formatted);
  for (const alias of aliases) {
    setIfBetter(alias);
  }
}

function buildRoleCandidateIndex(): {
  fuzzyCandidates: RoleCandidate[];
  directLookup: Map<string, RoleCandidate>;
} {
  const fuzzyCandidates: RoleCandidate[] = [];
  const directLookup = new Map<string, RoleCandidate>();

  for (const entry of CURATED_ROLE_CATALOG) {
    addCandidate(fuzzyCandidates, directLookup, entry.canonical, 100, entry.aliases);
  }

  for (const occupation of LOCAL_ONET_INDEX) {
    for (const alternate of occupation.alternateTitles) {
      addCandidate(fuzzyCandidates, directLookup, alternate, 70);
    }

    addCandidate(fuzzyCandidates, directLookup, singularizeLastWord(occupation.title), 60);
    addCandidate(fuzzyCandidates, directLookup, occupation.title, 55);
  }

  for (const role of RECOMMENDATION_ROLE_NAMES) {
    addCandidate(fuzzyCandidates, directLookup, role, 50);
  }

  return { fuzzyCandidates, directLookup };
}

function tokenize(text: string): string[] {
  const stop = new Set(["and", "the", "or", "of", "a", "an", "in", "for", "to", "with"]);
  return normalizeRoleText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !stop.has(token));
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;

  let intersect = 0;
  for (const token of left) {
    if (right.has(token)) intersect += 1;
  }

  return intersect / Math.max(left.size, right.size);
}

/** Normalize role text for comparison — not for user display. */
export function normalizeRoleText(raw: string): string {
  let text = raw.trim().toLowerCase();
  text = text.replace(/[^a-z0-9\s/+-]/g, " ");
  for (const [pattern, replacement] of ABBREVIATION_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

let roleIndexCache: ReturnType<typeof buildRoleCandidateIndex> | null = null;

function getRoleIndex(): ReturnType<typeof buildRoleCandidateIndex> {
  if (!roleIndexCache) {
    roleIndexCache = buildRoleCandidateIndex();
  }
  return roleIndexCache;
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
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

export function roleStringSimilarity(a: string, b: string): number {
  const left = normalizeRoleText(a);
  const right = normalizeRoleText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const maxLen = Math.max(left.length, right.length);
  const charSimilarity = 1 - levenshtein(left, right) / maxLen;
  const tokens = tokenSimilarity(a, b);

  if (charSimilarity >= 0.88) return charSimilarity;
  return charSimilarity * 0.55 + tokens * 0.45;
}

export type CanonicalRoleMatch = {
  canonical: string;
  matchConfidence: number;
  wasCanonicalized: boolean;
};

function findBestCandidate(raw: string): { candidate: RoleCandidate | null; score: number } {
  const trimmed = raw.trim();
  const normalizedInput = normalizeRoleText(trimmed);
  if (!normalizedInput) return { candidate: null, score: 0 };

  const direct = getRoleIndex().directLookup.get(normalizedInput);
  if (direct) return { candidate: direct, score: 1 };

  let best: { candidate: RoleCandidate | null; score: number; priority: number } = {
    candidate: null,
    score: 0,
    priority: -1,
  };

  for (const candidate of getRoleIndex().fuzzyCandidates) {
    const forms = [candidate.canonical, singularizeLastWord(candidate.canonical)];
    for (const form of forms) {
      const score = roleStringSimilarity(trimmed, form);
      if (score > best.score || (score === best.score && candidate.priority > best.priority)) {
        best = { candidate, score, priority: candidate.priority };
      }
    }
  }

  return { candidate: best.candidate, score: best.score };
}

/** Map raw user role text to a canonical career profile when confidence is high enough. */
export function resolveCanonicalRole(raw: string): CanonicalRoleMatch {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { canonical: trimmed, matchConfidence: 0, wasCanonicalized: false };
  }

  const formattedInput = formatRoleLabel(trimmed);
  const { candidate, score } = findBestCandidate(trimmed);

  if (candidate && score >= ROLE_MATCH_CONFIDENCE_THRESHOLD) {
    return {
      canonical: candidate.canonical,
      matchConfidence: score,
      wasCanonicalized: normalizeRoleText(candidate.canonical) !== normalizeRoleText(trimmed),
    };
  }

  return {
    canonical: formattedInput,
    matchConfidence: score,
    wasCanonicalized: formattedInput !== trimmed,
  };
}

export function resolveCanonicalRoles(input: {
  currentRole: string;
  targetRole: string;
}): {
  currentRole: string;
  targetRole: string;
  identifiedCareerProfile: string;
} {
  const current = resolveCanonicalRole(input.currentRole);
  const target = resolveCanonicalRole(input.targetRole);

  return {
    currentRole: current.canonical,
    targetRole: target.canonical,
    identifiedCareerProfile: current.canonical,
  };
}
