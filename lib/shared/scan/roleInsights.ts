import type { NormalizedScanInput } from "../types";
import { formatRoleLabel } from "./inferTargetRole";

type RoleFamily =
  | "salesforce"
  | "business_analyst"
  | "data_analyst"
  | "qa"
  | "project_manager"
  | "developer"
  | "generic";

type RoleInsightTemplate = {
  strengthSeeds: string[];
  riskSeeds: string[];
  opportunitySeeds: string[];
};

const ROLE_INSIGHTS: Record<RoleFamily, RoleInsightTemplate> = {
  salesforce: {
    strengthSeeds: [
      "Salesforce org configuration, security, and user management",
      "Flow, validation rules, and declarative automation design",
      "Translating business requirements into CRM workflows",
    ],
    riskSeeds: [
      "Declarative automation and AI copilots reducing routine admin work",
      "Commodity CRM configuration skills in a competitive market",
      "Frequent platform releases requiring ongoing upskilling",
    ],
    opportunitySeeds: [
      "Salesforce AI, Agentforce, and Einstein specialization",
      "Automation consulting focused on Flow and process design",
      "RevOps and CRM operations analyst paths",
    ],
  },
  business_analyst: {
    strengthSeeds: [
      "Requirements gathering and stakeholder facilitation",
      "Process mapping and workflow improvement",
      "Translating business needs into actionable specs",
    ],
    riskSeeds: [
      "AI tools automating documentation and status reporting",
      "Pressure to add technical depth beyond core BA work",
      "Competition from generalists using AI-assisted analysis",
    ],
    opportunitySeeds: [
      "AI-assisted business analysis and product operations",
      "Process automation and workflow design roles",
      "Cross-functional product and operations analyst paths",
    ],
  },
  data_analyst: {
    strengthSeeds: [
      "SQL, reporting, and metrics-driven analysis",
      "Building dashboards that inform business decisions",
      "Translating data into clear recommendations",
    ],
    riskSeeds: [
      "AI-assisted analytics reducing time on routine reporting",
      "Commodity dashboard work without pipeline depth",
      "Expectations shifting toward analytics engineering skills",
    ],
    opportunitySeeds: [
      "AI data analysis and automated insight generation",
      "Analytics engineering and pipeline ownership",
      "BI automation and self-serve analytics roles",
    ],
  },
  qa: {
    strengthSeeds: [
      "Test planning, defect triage, and quality standards",
      "Validating workflows before production release",
      "Attention to edge cases and regression risk",
    ],
    riskSeeds: [
      "Test automation reducing manual regression work",
      "AI-generated code increasing review surface area",
      "Shrinking demand for purely manual testing roles",
    ],
    opportunitySeeds: [
      "AI QA and model output evaluation roles",
      "Test automation engineering paths",
      "Quality engineering within product delivery teams",
    ],
  },
  project_manager: {
    strengthSeeds: [
      "Cross-team coordination and delivery planning",
      "Stakeholder communication and risk management",
      "Keeping complex initiatives on track",
    ],
    riskSeeds: [
      "AI tools automating status updates and reporting",
      "Leaner teams expecting PMs to own more execution",
      "Competition from operators with stronger domain depth",
    ],
    opportunitySeeds: [
      "AI program and transformation coordination",
      "Technical program analyst roles",
      "Operational leadership in automation initiatives",
    ],
  },
  developer: {
    strengthSeeds: [
      "Building, debugging, and shipping software",
      "Systems thinking across APIs and integrations",
      "Working with modern delivery and deployment practices",
    ],
    riskSeeds: [
      "AI code generation changing junior delivery expectations",
      "Boilerplate and routine implementation work compressing",
      "Global competition for implementation-heavy roles",
    ],
    opportunitySeeds: [
      "AI-augmented software development workflows",
      "Integration and platform engineering paths",
      "Specialization in security, reliability, or architecture",
    ],
  },
  generic: {
    strengthSeeds: [
      "Hands-on experience in your current workflow",
      "Problem-solving within your domain context",
      "Collaboration across teams and tools",
    ],
    riskSeeds: [
      "Routine work increasingly supported by AI tools",
      "Skill stagnation if tools change faster than your learning",
      "Adjacent talent competing for similar responsibilities",
    ],
    opportunitySeeds: [
      "AI-assisted workflows in your current function",
      "Adjacent roles that reuse your domain knowledge",
      "Process improvement and automation projects",
    ],
  },
};

function tokenizeList(text: string): string[] {
  return text
    .split(/[,;\n/|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && item !== "—")
    .slice(0, 6);
}

export function detectRoleFamily(role: string, skills: string, tools: string): RoleFamily {
  const context = `${role} ${skills} ${tools}`.toLowerCase();

  if (/salesforce|sfdc|agentforce|crm admin|platform admin/.test(context)) {
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

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Role-relevant strengths, risks, and opportunities — avoids generic O*NET skill labels. */
export function buildRoleInsights(
  input: NormalizedScanInput,
  role: string,
  isTarget: boolean,
  transitionGap = 0
): { strengths: string[]; vulnerabilities: string[]; opportunityZones: string[] } {
  const family = detectRoleFamily(role, input.skills, input.tools);
  const template = ROLE_INSIGHTS[family];
  const skills = tokenizeList(input.skills);
  const tools = tokenizeList(input.tools);
  const roleLabel = formatRoleLabel(role);

  const strengths = uniqueItems([
    ...skills.slice(0, 2).map((skill) => `${skill} applied in ${roleLabel} workflows`),
    ...(tools.length > 0 ? [`Daily use of ${tools.slice(0, 2).join(" and ")}`] : []),
    ...template.strengthSeeds,
  ]).slice(0, 4);

  const risks = uniqueItems([
    ...(isTarget && transitionGap > 40
      ? [`Noticeable skill gap for a move into ${roleLabel}`]
      : []),
    ...template.riskSeeds,
  ]).slice(0, 4);

  const opportunities = uniqueItems([
    ...template.opportunitySeeds.slice(0, 3),
    input.industry !== "General"
      ? `${input.industry} teams are investing in workflow and AI-enabled operations`
      : "Specialize in AI-assisted workflows within your current function",
  ]).slice(0, 4);

  return {
    strengths,
    vulnerabilities: risks,
    opportunityZones: opportunities,
  };
}
