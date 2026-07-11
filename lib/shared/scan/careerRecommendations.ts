import type { CareerDirectionRecommendation, NormalizedScanInput } from "../types";
import { formatRoleLabel } from "./inferTargetRole";

export const TOP_CAREER_DIRECTIONS_INTRO =
  "These are realistic next roles based on your current experience, skills, and tools — ranked by how transferable your background is.";

export const NEXT_ROLES_COUNT = 5;

type RoleFamily =
  | "salesforce"
  | "business_analyst"
  | "data_analyst"
  | "qa"
  | "project_manager"
  | "developer"
  | "generic";

type CandidateTemplate = {
  role: string;
  transferabilityScore: number;
  why: string;
  keywords: string;
  transferableSkills: [string, string, string];
  salaryMin: number;
  salaryMax: number;
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
      why: "Your Salesforce platform knowledge, automation experience, and user support skills transfer directly.",
      keywords: "salesforce flow automation admin platform crm service cloud",
      transferableSkills: ["Salesforce configuration", "Process automation", "User enablement"],
      salaryMin: 95000,
      salaryMax: 125000,
    },
    {
      role: "Agentforce Specialist",
      transferabilityScore: 88,
      why: "Your Salesforce workflows, service processes, and admin configuration map well to AI-assisted CRM operations.",
      keywords: "salesforce agentforce service automation ai crm",
      transferableSkills: ["CRM workflow design", "Service process knowledge", "AI-assisted tooling"],
      salaryMin: 100000,
      salaryMax: 135000,
    },
    {
      role: "Salesforce Automation Consultant",
      transferabilityScore: 85,
      why: "Your flows, process improvement, and system maintenance experience align with automation consulting.",
      keywords: "salesforce flow automation consultant process",
      transferableSkills: ["Flow / automation design", "Requirements translation", "Stakeholder communication"],
      salaryMin: 105000,
      salaryMax: 140000,
    },
    {
      role: "Revenue Operations Analyst",
      transferabilityScore: 80,
      why: "Your CRM data, reporting, and process knowledge support RevOps analysis and pipeline operations.",
      keywords: "revops revenue operations crm reporting pipeline salesforce",
      transferableSkills: ["CRM reporting", "Pipeline hygiene", "Cross-team coordination"],
      salaryMin: 85000,
      salaryMax: 115000,
    },
    {
      role: "Salesforce Business Analyst",
      transferabilityScore: 78,
      why: "Your platform fluency and business-process understanding fit Salesforce BA work.",
      keywords: "salesforce business analyst requirements process stakeholder",
      transferableSkills: ["Requirements gathering", "Salesforce domain knowledge", "Process mapping"],
      salaryMin: 90000,
      salaryMax: 120000,
    },
  ],
  business_analyst: [
    {
      role: "AI Business Analyst",
      transferabilityScore: 90,
      why: "Your requirements gathering, stakeholder communication, and process analysis skills transfer directly.",
      keywords: "requirements stakeholder process analysis business",
      transferableSkills: ["Requirements analysis", "Stakeholder management", "Process documentation"],
      salaryMin: 95000,
      salaryMax: 130000,
    },
    {
      role: "Product Operations Analyst",
      transferabilityScore: 85,
      why: "You already work across teams, workflows, and business processes.",
      keywords: "operations workflow cross-functional product process",
      transferableSkills: ["Cross-functional coordination", "Workflow design", "Metrics tracking"],
      salaryMin: 90000,
      salaryMax: 120000,
    },
    {
      role: "Process Automation Analyst",
      transferabilityScore: 82,
      why: "Your analytical and process-improvement skills align with automation initiatives.",
      keywords: "process automation improvement workflow analysis",
      transferableSkills: ["Process mapping", "Automation opportunity spotting", "Change enablement"],
      salaryMin: 88000,
      salaryMax: 118000,
    },
    {
      role: "Systems Analyst",
      transferabilityScore: 79,
      why: "Your bridging of business needs and system capabilities is core systems-analyst work.",
      keywords: "systems analyst requirements integration functional",
      transferableSkills: ["Functional analysis", "System documentation", "UAT coordination"],
      salaryMin: 85000,
      salaryMax: 115000,
    },
    {
      role: "Product Analyst",
      transferabilityScore: 76,
      why: "Your discovery and prioritization instincts map well to product analytics and insights.",
      keywords: "product analyst metrics discovery prioritization insights",
      transferableSkills: ["Business insights", "Prioritization", "User research synthesis"],
      salaryMin: 90000,
      salaryMax: 125000,
    },
  ],
  data_analyst: [
    {
      role: "AI Data Analyst",
      transferabilityScore: 91,
      why: "Your data analysis, reporting, and business-question skills transfer into AI-assisted analytics.",
      keywords: "data analysis sql reporting analytics dashboard",
      transferableSkills: ["SQL / querying", "Dashboarding", "Business storytelling with data"],
      salaryMin: 95000,
      salaryMax: 130000,
    },
    {
      role: "Analytics Engineer",
      transferabilityScore: 85,
      why: "Your SQL, modeling, and pipeline experience aligns with reliable analytics workflows.",
      keywords: "sql pipeline modeling dbt analytics engineering",
      transferableSkills: ["Data modeling", "SQL fluency", "Pipeline reliability"],
      salaryMin: 110000,
      salaryMax: 150000,
    },
    {
      role: "BI Automation Analyst",
      transferabilityScore: 82,
      why: "Your reporting and dashboard experience maps to automating BI processes.",
      keywords: "bi dashboard reporting tableau power bi automation",
      transferableSkills: ["BI tooling", "Report automation", "KPI definition"],
      salaryMin: 90000,
      salaryMax: 120000,
    },
    {
      role: "Business Intelligence Analyst",
      transferabilityScore: 80,
      why: "Your analytical foundation supports broader BI and decision-support work.",
      keywords: "business intelligence bi reporting insights stakeholders",
      transferableSkills: ["Insight generation", "Stakeholder reporting", "Data visualization"],
      salaryMin: 85000,
      salaryMax: 115000,
    },
    {
      role: "Operations Data Analyst",
      transferabilityScore: 77,
      why: "Your metrics mindset fits operational analytics and continuous improvement.",
      keywords: "operations data analyst metrics efficiency process",
      transferableSkills: ["Operational metrics", "Root-cause analysis", "Process measurement"],
      salaryMin: 80000,
      salaryMax: 110000,
    },
  ],
  qa: [
    {
      role: "AI QA Analyst",
      transferabilityScore: 90,
      why: "Your test planning, defect tracking, and quality standards experience transfer directly.",
      keywords: "qa testing quality defects test cases validation",
      transferableSkills: ["Test planning", "Defect analysis", "Quality standards"],
      salaryMin: 85000,
      salaryMax: 115000,
    },
    {
      role: "Test Automation Analyst",
      transferabilityScore: 88,
      why: "Your testing workflows and attention to detail align with automated coverage.",
      keywords: "test automation selenium cypress qa scripting",
      transferableSkills: ["Test case design", "Automation scripting", "Regression strategy"],
      salaryMin: 95000,
      salaryMax: 130000,
    },
    {
      role: "AI Evaluation Specialist",
      transferabilityScore: 80,
      why: "Your quality mindset applies to reviewing AI system outputs.",
      keywords: "evaluation validation quality testing ai outputs",
      transferableSkills: ["Output evaluation", "Edge-case thinking", "Quality rubrics"],
      salaryMin: 100000,
      salaryMax: 140000,
    },
    {
      role: "Quality Engineering Analyst",
      transferabilityScore: 78,
      why: "Your end-to-end quality perspective fits broader QE collaboration with engineering.",
      keywords: "quality engineering qe testing ci release",
      transferableSkills: ["Release validation", "Risk-based testing", "Team collaboration"],
      salaryMin: 90000,
      salaryMax: 125000,
    },
    {
      role: "SDET Associate",
      transferabilityScore: 74,
      why: "Your testing foundation is a practical bridge into developer-in-test work.",
      keywords: "sdet test development coding automation frameworks",
      transferableSkills: ["Automated testing", "Debugging mindset", "Framework usage"],
      salaryMin: 100000,
      salaryMax: 140000,
    },
  ],
  project_manager: [
    {
      role: "AI Project Manager",
      transferabilityScore: 89,
      why: "Your planning, stakeholder coordination, and delivery experience transfer directly.",
      keywords: "project planning delivery stakeholder timeline coordination",
      transferableSkills: ["Delivery planning", "Stakeholder management", "Risk tracking"],
      salaryMin: 105000,
      salaryMax: 145000,
    },
    {
      role: "Technical Program Analyst",
      transferabilityScore: 85,
      why: "You already coordinate timelines, dependencies, and cross-team communication.",
      keywords: "program technical dependencies cross-team coordination",
      transferableSkills: ["Dependency management", "Status communication", "Cross-team alignment"],
      salaryMin: 100000,
      salaryMax: 140000,
    },
    {
      role: "AI Program Coordinator",
      transferabilityScore: 83,
      why: "Your organizational skills align with coordinating AI initiatives.",
      keywords: "program coordinator planning organization follow-through",
      transferableSkills: ["Program coordination", "Meeting cadence", "Follow-through"],
      salaryMin: 85000,
      salaryMax: 115000,
    },
    {
      role: "Implementation Project Manager",
      transferabilityScore: 80,
      why: "Your delivery discipline fits software/process implementation projects.",
      keywords: "implementation project manager rollout change management",
      transferableSkills: ["Implementation planning", "Change management", "Vendor coordination"],
      salaryMin: 95000,
      salaryMax: 130000,
    },
    {
      role: "Scrum Master / Agile Facilitator",
      transferabilityScore: 76,
      why: "Your team facilitation and delivery rhythm map to agile coaching roles.",
      keywords: "scrum master agile facilitation sprint ceremony coaching",
      transferableSkills: ["Agile ceremonies", "Team facilitation", "Impediment removal"],
      salaryMin: 90000,
      salaryMax: 125000,
    },
  ],
  developer: [
    {
      role: "AI-Assisted Software Developer",
      transferabilityScore: 88,
      why: "Your coding and debugging experience transfers into AI-augmented development workflows.",
      keywords: "software development coding debugging git api",
      transferableSkills: ["Software development", "Debugging", "Version control"],
      salaryMin: 110000,
      salaryMax: 155000,
    },
    {
      role: "Integration Developer",
      transferabilityScore: 84,
      why: "Your technical skills align with connecting systems, APIs, and workflows.",
      keywords: "integration api middleware systems implementation",
      transferableSkills: ["API integration", "Systems thinking", "Implementation"],
      salaryMin: 105000,
      salaryMax: 145000,
    },
    {
      role: "Platform Support Engineer",
      transferabilityScore: 81,
      why: "Your troubleshooting knowledge maps to keeping platforms reliable.",
      keywords: "platform support troubleshooting deployment reliability",
      transferableSkills: ["Troubleshooting", "Platform operations", "Incident response"],
      salaryMin: 95000,
      salaryMax: 130000,
    },
    {
      role: "Automation Engineer",
      transferabilityScore: 79,
      why: "Your scripting and systems background fits automation engineering.",
      keywords: "automation engineer scripting devops workflow bots",
      transferableSkills: ["Scripting", "Workflow automation", "Reliability focus"],
      salaryMin: 105000,
      salaryMax: 145000,
    },
    {
      role: "Solutions Engineer",
      transferabilityScore: 75,
      why: "Your technical depth plus communication skills support customer-facing solution roles.",
      keywords: "solutions engineer demo technical sales implementation",
      transferableSkills: ["Technical communication", "Solution design", "Customer demos"],
      salaryMin: 115000,
      salaryMax: 160000,
    },
  ],
};

const GENERIC_TEMPLATES: CandidateTemplate[] = [
  {
    role: "Operations Analyst",
    transferabilityScore: 78,
    why: "Your workflow knowledge and process familiarity transfer into analyst work in your domain.",
    keywords: "operations workflow process analysis coordination",
    transferableSkills: ["Process familiarity", "Coordination", "Documentation"],
    salaryMin: 70000,
    salaryMax: 95000,
  },
  {
    role: "Process Improvement Specialist",
    transferabilityScore: 75,
    why: "Your experience improving how work gets done aligns with efficiency projects.",
    keywords: "process improvement workflow efficiency documentation",
    transferableSkills: ["Process improvement", "Efficiency analysis", "Change support"],
    salaryMin: 75000,
    salaryMax: 105000,
  },
  {
    role: "AI Workflow Coordinator",
    transferabilityScore: 72,
    why: "Your organizational skills can support teams adopting AI-assisted workflows.",
    keywords: "workflow coordination tools adoption enablement",
    transferableSkills: ["Tool adoption", "Workflow coordination", "Enablement"],
    salaryMin: 70000,
    salaryMax: 100000,
  },
  {
    role: "Business Operations Associate",
    transferabilityScore: 70,
    why: "Your cross-functional habits fit broader business operations support roles.",
    keywords: "business operations associate support coordination admin",
    transferableSkills: ["Operational support", "Priority juggling", "Team communication"],
    salaryMin: 65000,
    salaryMax: 90000,
  },
  {
    role: "Digital Transformation Coordinator",
    transferabilityScore: 68,
    why: "Your familiarity with tools and change supports digital transformation initiatives.",
    keywords: "digital transformation coordinator change tools rollout",
    transferableSkills: ["Change coordination", "Tool rollout", "Stakeholder updates"],
    salaryMin: 75000,
    salaryMax: 105000,
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

  if (/salesforce|crm admin|platform admin|salesforce admin|salesforce administrator|apex/.test(context)) {
    return "salesforce";
  }
  if (/data analyst|analytics analyst|bi analyst|business intelligence analyst|database administrator|\bdba\b/.test(context)) {
    return "data_analyst";
  }
  if (/business analyst|systems analyst|functional analyst/.test(context) && !/data analyst/.test(context)) {
    return "business_analyst";
  }
  if (/qa analyst|quality assurance|test analyst|software tester|qa engineer/.test(context)) {
    return "qa";
  }
  if (
    /project manager|program manager|delivery manager|scrum master/.test(context) &&
    !/product manager/.test(context)
  ) {
    return "project_manager";
  }
  if (
    /developer|engineer|devops|software|programmer|sre|frontend|backend|full.?stack|cloud|platform engineer|solutions architect|cybersecurity|sysadmin|systems administrator/.test(
      context
    )
  ) {
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

function scoreTransferability(input: NormalizedScanInput, candidate: CandidateTemplate): number {
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
  candidate: CandidateTemplate,
  fitScore: number
): CareerDirectionRecommendation {
  const transition = transitionMonthsForFit(fitScore, input.yearsExperience);
  const avg = Math.round((candidate.salaryMin + candidate.salaryMax) / 2);

  return {
    role: candidate.role.trim(),
    transferabilityScore: fitScore,
    why: candidate.why,
    avgNationalSalaryUsd: avg,
    salaryRangeUsd: { min: candidate.salaryMin, max: candidate.salaryMax },
    salaryLabel: formatSalaryRange(candidate.salaryMin, candidate.salaryMax),
    transferableSkills: [...candidate.transferableSkills],
    transitionMonths: { min: transition.min, max: transition.max },
    transitionLabel: transition.label,
  };
}

function getTemplates(family: RoleFamily): CandidateTemplate[] {
  if (family === "generic") return GENERIC_TEMPLATES;
  return FAMILY_TEMPLATES[family];
}

function rankCandidates(
  input: NormalizedScanInput,
  templates: CandidateTemplate[],
  limit = NEXT_ROLES_COUNT
): CareerDirectionRecommendation[] {
  const currentNorm = input.currentRole.trim().toLowerCase();

  return templates
    .filter((candidate) => candidate.role.trim().toLowerCase() !== currentNorm)
    .filter((candidate) => !hasMajorRetrainingGap(input, candidate.role))
    .map((candidate) => {
      const fit = scoreTransferability(input, candidate);
      return enrichRecommendation(input, candidate, fit);
    })
    .sort((a, b) => b.transferabilityScore - a.transferabilityScore)
    .slice(0, limit);
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

/** Realistic next-step career directions from current role profile — top 5. */
export function buildRecommendations(input: NormalizedScanInput): CareerDirectionRecommendation[] {
  const family = detectRoleFamily(input);
  const templates = getTemplates(family);
  const ranked = rankCandidates(input, templates);

  if (ranked.length >= NEXT_ROLES_COUNT) return ranked;

  const extras = rankCandidates(
    input,
    GENERIC_TEMPLATES.filter(
      (template) => !ranked.some((item) => item.role.toLowerCase() === template.role.toLowerCase())
    ),
    NEXT_ROLES_COUNT - ranked.length
  );

  return [...ranked, ...extras]
    .filter(
      (item, index, all) =>
        all.findIndex((other) => other.role.toLowerCase() === item.role.toLowerCase()) === index
    )
    .slice(0, NEXT_ROLES_COUNT);
}
