import type { CareerDirectionRecommendation, NormalizedScanInput } from "../types";
import { formatRoleLabel } from "./inferTargetRole";

export const TOP_CAREER_DIRECTIONS_INTRO =
  "These recommendations represent realistic next-step career opportunities based on your current experience, skills, and workflow expertise.";

type RoleFamily =
  | "salesforce"
  | "business_analyst"
  | "data_analyst"
  | "qa"
  | "project_manager"
  | "developer"
  | "generic";

type CandidateTemplate = CareerDirectionRecommendation & {
  keywords: string;
  distant?: boolean;
};

const DISTANT_ROLE_PATTERNS = [
  /machine learning engineer/i,
  /\bml engineer\b/i,
  /ai product manager/i,
  /ai operations manager/i,
  /ai governance lead/i,
  /ai governance analyst/i,
];

const FAMILY_TEMPLATES: Record<Exclude<RoleFamily, "generic">, CandidateTemplate[]> = {
  salesforce: [
    {
      role: "Salesforce AI Administrator",
      transferabilityScore: 92,
      why: "Your Salesforce platform knowledge, automation experience, user support, and business process expertise transfer directly.",
      keywords: "salesforce flow automation admin platform crm service cloud",
    },
    {
      role: "Agentforce Specialist",
      transferabilityScore: 88,
      why: "Your experience with Salesforce workflows, automation, service processes, and admin configuration maps well to AI-assisted CRM operations.",
      keywords: "salesforce agentforce service automation ai crm",
    },
    {
      role: "Salesforce Automation Consultant",
      transferabilityScore: 85,
      why: "Your background in flows, process improvement, user enablement, and system maintenance aligns closely with automation-focused consulting work.",
      keywords: "salesforce flow automation consultant process",
    },
  ],
  business_analyst: [
    {
      role: "AI Business Analyst",
      transferabilityScore: 90,
      why: "Your requirements gathering, stakeholder communication, and process analysis skills transfer directly.",
      keywords: "requirements stakeholder process analysis business",
    },
    {
      role: "Product Operations Analyst",
      transferabilityScore: 85,
      why: "You already work across teams, workflows, and business processes.",
      keywords: "operations workflow cross-functional product process",
    },
    {
      role: "Process Automation Analyst",
      transferabilityScore: 82,
      why: "Your analytical and process-improvement skills align with automation initiatives.",
      keywords: "process automation improvement workflow analysis",
    },
  ],
  data_analyst: [
    {
      role: "AI Data Analyst",
      transferabilityScore: 91,
      why: "Your data analysis, reporting, and business question skills transfer directly into AI-assisted analytics work.",
      keywords: "data analysis sql reporting analytics dashboard",
    },
    {
      role: "Analytics Engineer",
      transferabilityScore: 85,
      why: "Your SQL, data modeling, and pipeline experience aligns with building reliable analytics workflows.",
      keywords: "sql pipeline modeling dbt analytics engineering",
    },
    {
      role: "BI Automation Analyst",
      transferabilityScore: 82,
      why: "Your reporting and dashboard experience maps well to automating business intelligence processes.",
      keywords: "bi dashboard reporting tableau power bi automation",
    },
  ],
  qa: [
    {
      role: "AI QA Analyst",
      transferabilityScore: 90,
      why: "Your test planning, defect tracking, and quality standards experience transfers directly.",
      keywords: "qa testing quality defects test cases validation",
    },
    {
      role: "Test Automation Analyst",
      transferabilityScore: 88,
      why: "Your testing workflows and attention to detail align with scripted and automated test coverage.",
      keywords: "test automation selenium cypress qa scripting",
    },
    {
      role: "AI Evaluation Specialist",
      transferabilityScore: 80,
      why: "Your quality mindset and validation experience apply to reviewing AI system outputs.",
      keywords: "evaluation validation quality testing ai outputs",
    },
  ],
  project_manager: [
    {
      role: "AI Project Manager",
      transferabilityScore: 89,
      why: "Your planning, stakeholder coordination, and delivery experience transfer directly.",
      keywords: "project planning delivery stakeholder timeline coordination",
    },
    {
      role: "Technical Program Analyst",
      transferabilityScore: 85,
      why: "You already coordinate timelines, dependencies, and cross-team communication.",
      keywords: "program technical dependencies cross-team coordination",
    },
    {
      role: "AI Program Coordinator",
      transferabilityScore: 83,
      why: "Your organizational and follow-through skills align with coordinating AI initiatives.",
      keywords: "program coordinator planning organization follow-through",
    },
  ],
  developer: [
    {
      role: "AI-Assisted Software Developer",
      transferabilityScore: 88,
      why: "Your coding, debugging, and delivery experience transfers directly into AI-augmented development workflows.",
      keywords: "software development coding debugging git api",
    },
    {
      role: "Integration Developer",
      transferabilityScore: 84,
      why: "Your technical implementation skills align with connecting systems, APIs, and business workflows.",
      keywords: "integration api middleware systems implementation",
    },
    {
      role: "Platform Support Engineer",
      transferabilityScore: 81,
      why: "Your troubleshooting and system knowledge map well to keeping platforms reliable for users.",
      keywords: "platform support troubleshooting deployment reliability",
    },
  ],
};

const GENERIC_TEMPLATES: CandidateTemplate[] = [
  {
    role: "Operations Analyst",
    transferabilityScore: 78,
    why: "Your day-to-day workflow knowledge and process familiarity transfer into analyst work in your current domain.",
    keywords: "operations workflow process analysis coordination",
  },
  {
    role: "Process Improvement Specialist",
    transferabilityScore: 75,
    why: "Your experience improving how work gets done aligns with practical automation and efficiency projects.",
    keywords: "process improvement workflow efficiency documentation",
  },
  {
    role: "AI Workflow Coordinator",
    transferabilityScore: 72,
    why: "Your organizational skills and familiarity with existing tools can support teams adopting AI-assisted workflows.",
    keywords: "workflow coordination tools adoption enablement",
  },
];

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

function detectRoleFamily(input: NormalizedScanInput): RoleFamily {
  const role = input.currentRole.toLowerCase();
  const context = `${role} ${input.skills.toLowerCase()} ${input.tools.toLowerCase()}`;

  if (/salesforce|crm admin|platform admin|salesforce admin|salesforce administrator/.test(context)) {
    return "salesforce";
  }
  if (/data analyst|analytics analyst|bi analyst|business intelligence analyst/.test(context)) {
    return "data_analyst";
  }
  if (/business analyst|systems analyst|functional analyst/.test(context) && !/data analyst/.test(context)) {
    return "business_analyst";
  }
  if (/qa analyst|quality assurance|test analyst|software tester|qa engineer/.test(context)) {
    return "qa";
  }
  if (/project manager|program manager|delivery manager/.test(context) && !/product manager/.test(context)) {
    return "project_manager";
  }
  if (/developer|engineer|devops|software|programmer|sre/.test(context)) {
    return "developer";
  }

  return "generic";
}

function isDistantRole(role: string): boolean {
  return DISTANT_ROLE_PATTERNS.some((pattern) => pattern.test(role));
}

function hasMajorRetrainingGap(input: NormalizedScanInput, role: string): boolean {
  if (!isDistantRole(role)) return false;

  const profile = `${input.currentRole} ${input.skills} ${input.tools}`.toLowerCase();

  if (/machine learning engineer|\bml engineer\b/.test(role)) {
    return !/\b(ml|machine learning|deep learning|pytorch|tensorflow)\b/.test(profile);
  }
  if (/ai product manager/.test(role)) {
    return !/product manager|product owner|product management/.test(input.currentRole.toLowerCase());
  }
  if (/ai operations manager|ai governance/.test(role)) {
    return !/operations manager|governance|compliance program/.test(profile);
  }

  return true;
}

function industryRelevance(input: NormalizedScanInput, keywords: string): number {
  if (input.industry === "General") return 0.55;
  const industryOverlap = overlapRatio(input.industry, keywords);
  return 0.65 + industryOverlap * 0.35;
}

function yearsRelevance(years: number): number {
  if (years >= 8) return 1;
  if (years >= 5) return 0.9;
  if (years >= 2) return 0.75;
  return 0.6;
}

function scoreTransferability(
  input: NormalizedScanInput,
  candidate: CandidateTemplate
): number {
  const context = `${input.skills} ${input.tools} ${input.currentRole}`;
  const skillOverlap = overlapRatio(input.skills, `${candidate.role} ${candidate.keywords}`);
  const toolOverlap = overlapRatio(input.tools, `${candidate.role} ${candidate.keywords}`);
  const workflowOverlap = overlapRatio(input.currentRole, `${candidate.role} ${candidate.keywords}`);
  const industryOverlap = industryRelevance(input, candidate.keywords);
  const experienceOverlap = yearsRelevance(input.yearsExperience);

  const weighted =
    skillOverlap * 0.3 +
    toolOverlap * 0.25 +
    workflowOverlap * 0.2 +
    industryOverlap * 0.15 +
    experienceOverlap * 0.1;

  const adjustment = Math.round((weighted - 0.55) * 10);
  return clampScore(candidate.transferabilityScore + adjustment);
}

function getTemplates(family: RoleFamily): CandidateTemplate[] {
  if (family === "generic") return GENERIC_TEMPLATES;
  return FAMILY_TEMPLATES[family];
}

function rankCandidates(
  input: NormalizedScanInput,
  templates: CandidateTemplate[]
): CareerDirectionRecommendation[] {
  const currentNorm = input.currentRole.trim().toLowerCase();

  return templates
    .filter((candidate) => candidate.role.trim().toLowerCase() !== currentNorm)
    .filter((candidate) => !hasMajorRetrainingGap(input, candidate.role))
    .map((candidate) => ({
      role: candidate.role.trim(),
      transferabilityScore: scoreTransferability(input, candidate),
      why: candidate.why,
    }))
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore)
    .slice(0, 3);
}

/** Legacy scan payloads may still store plain role strings. */
export function normalizeCareerRecommendations(
  items: CareerDirectionRecommendation[] | string[] | undefined | null
): CareerDirectionRecommendation[] {
  if (!items?.length) return [];

  if (typeof items[0] === "string") {
    return (items as string[]).slice(0, 3).map((role, index) => ({
      role: formatRoleLabel(role),
      transferabilityScore: clampScore(84 - index * 3),
      why: "Based on your current experience, skills, and workflow expertise, this path appears adjacent to your background.",
    }));
  }

  return (items as CareerDirectionRecommendation[]).slice(0, 3).map((item) => ({
    role: item.role.trim(),
    transferabilityScore: clampScore(item.transferabilityScore),
    why: item.why,
  }));
}

export function firstCareerRecommendationRole(
  items: CareerDirectionRecommendation[] | string[] | undefined | null,
  fallback: string
): string {
  const normalized = normalizeCareerRecommendations(items);
  return normalized[0]?.role ?? fallback;
}

/** Realistic next-step career directions from current role profile — not aspirational jumps. */
export function buildRecommendations(input: NormalizedScanInput): CareerDirectionRecommendation[] {
  const family = detectRoleFamily(input);
  const templates = getTemplates(family);
  const ranked = rankCandidates(input, templates);

  if (ranked.length >= 3) return ranked;

  const extras = rankCandidates(
    input,
    GENERIC_TEMPLATES.filter(
      (template) => !ranked.some((item) => item.role.toLowerCase() === template.role.toLowerCase())
    )
  );

  return [...ranked, ...extras]
    .filter(
      (item, index, all) =>
        all.findIndex((other) => other.role.toLowerCase() === item.role.toLowerCase()) === index
    )
    .slice(0, 3);
}
