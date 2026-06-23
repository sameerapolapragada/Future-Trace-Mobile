import type { FreeScanResult, RoleScanProfile } from "../types";
import { resolveDisruptionStatus, type DisruptionRadarStatus } from "./disruptionStatus";

export type RoleDisruptionFocus = "current" | "target";

export type RoleDisruptionAnalysisSection = {
  title: string;
  intro?: string;
  bullets: string[];
};

export type RoleDisruptionAnalysis = {
  focus: RoleDisruptionFocus;
  roleLabel: "Current Role" | "Target Role";
  roleTitle: string;
  status: DisruptionRadarStatus;
  statusSummary: string;
  resilienceScore: number;
  whyThisStatus: RoleDisruptionAnalysisSection;
  durableValue: RoleDisruptionAnalysisSection;
  skillsBecomingImportant: RoleDisruptionAnalysisSection;
  keyOpportunity: RoleDisruptionAnalysisSection;
  outlook: string;
};

export const ROLE_DISRUPTION_ANALYSIS_FOOTER =
  "Analysis is based on current AI trends and industry data. Results may change as technology and markets evolve.";

const STATUS_SUMMARY: Record<DisruptionRadarStatus, string> = {
  Stable: "Lower risk of disruption. AI will augment this role, not replace it.",
  Evolving: "Some parts of this role are likely to change with AI.",
  "At Risk": "Higher likelihood of automation or replacement of core responsibilities.",
};

const SKILLS_BY_STATUS: Record<DisruptionRadarStatus, string[]> = {
  Stable: [
    "AI solution design and governance",
    "Strategic workflow and platform decisions",
    "Cross-functional communication with business stakeholders",
  ],
  Evolving: [
    "AI-assisted workflow design",
    "Process improvement and automation oversight",
    "Data-informed decision making",
  ],
  "At Risk": [
    "Judgment-heavy problem solving",
    "Relationship management and stakeholder trust",
    "Specialized domain expertise that is hard to automate",
  ],
};

const OPPORTUNITY_FALLBACKS: Record<DisruptionRadarStatus, string[]> = {
  Stable: [
    "Growing demand for professionals who implement and manage AI responsibly",
    "Opportunity to become a trusted advisor on AI-enabled workflows",
  ],
  Evolving: [
    "Chance to lead adoption of AI tools within existing teams",
    "Path to specialize in high-value, less automatable responsibilities",
  ],
  "At Risk": [
    "Window to transition toward adjacent roles with stronger durability",
    "Upskilling now can improve readiness for evolving job requirements",
  ],
};

const OUTLOOK_BY_STATUS: Record<DisruptionRadarStatus, string> = {
  Stable:
    "This role appears well positioned to remain relevant as AI adoption accelerates, especially for professionals who combine domain expertise with responsible AI implementation.",
  Evolving:
    "This role is likely to keep evolving alongside AI tools. Professionals who adapt workflows and build AI-adjacent skills can stay competitive over the next several years.",
  "At Risk":
    "This role faces meaningful pressure from automation. Proactive reskilling and a clearer transition path can help reduce long-term disruption risk.",
};

function pickBullets(items: string[], fallbacks: string[], max = 4): string[] {
  const picked = items.map((item) => item.trim()).filter(Boolean).slice(0, max);
  for (const fallback of fallbacks) {
    if (picked.length >= max) break;
    if (!picked.includes(fallback)) picked.push(fallback);
  }
  return picked;
}

function profileForFocus(result: FreeScanResult, focus: RoleDisruptionFocus): RoleScanProfile {
  return focus === "current" ? result.currentRoleProfile : result.targetRoleProfile;
}

function roleTitleForFocus(result: FreeScanResult, focus: RoleDisruptionFocus): string {
  if (focus === "current") return result.identifiedCareerProfile ?? result.currentRole;
  return result.targetRole;
}

function whyIntro(status: DisruptionRadarStatus): string | undefined {
  if (status === "Stable") {
    return "Core responsibilities in this role remain durable because they rely on judgment, context, and human oversight.";
  }
  if (status === "Evolving") {
    return "AI is changing how routine work gets done, but important parts of the role still depend on human expertise.";
  }
  return "Automation pressure is elevated for core tasks in this role based on your scan profile.";
}

function whyBullets(profile: RoleScanProfile, status: DisruptionRadarStatus): string[] {
  if (status === "Stable") {
    return pickBullets(
      profile.strengths,
      [
        "Strategic decisions and business context remain human-led",
        "Governance, quality control, and stakeholder trust stay essential",
        "Complex problem solving is harder to fully automate",
      ],
      3
    );
  }

  return pickBullets(
    profile.vulnerabilities,
    status === "Evolving"
      ? [
          "Routine configuration and reporting tasks are increasingly AI-assisted",
          "Workflow documentation and standard updates are shifting faster",
          "Teams are expected to work alongside AI copilots and automation",
        ]
      : [
          "A meaningful share of routine responsibilities may be automated",
          "Competition may increase as AI lowers the barrier to commodity tasks",
          "Employers may reorganize teams around smaller AI-augmented groups",
        ],
    3
  );
}

function durableBullets(profile: RoleScanProfile, status: DisruptionRadarStatus): string[] {
  if (status === "Stable") {
    return pickBullets(
      profile.strengths,
      [
        "AI can accelerate execution while humans retain accountability",
        "Professionals can focus more on design, governance, and outcomes",
        "Domain expertise becomes more valuable when paired with AI fluency",
      ],
      3
    );
  }

  return pickBullets(
    profile.strengths,
    [
      "Judgment, communication, and stakeholder management remain critical",
      "Experience translating business needs into practical solutions still matters",
      "Ability to validate AI output and manage exceptions stays valuable",
    ],
    3
  );
}

function skillsBullets(profile: RoleScanProfile, status: DisruptionRadarStatus): string[] {
  return pickBullets(profile.opportunityZones, SKILLS_BY_STATUS[status], 3);
}

function opportunityBullets(profile: RoleScanProfile, status: DisruptionRadarStatus): string[] {
  return pickBullets(profile.opportunityZones, OPPORTUNITY_FALLBACKS[status], 2);
}

function durableTitle(status: DisruptionRadarStatus): string {
  return status === "Stable" ? "Why AI Strengthens This Role" : "What Remains Valuable";
}

/** Full-page disruption analysis for the current or target role from a scan. */
export function buildRoleDisruptionAnalysis(
  result: FreeScanResult,
  focus: RoleDisruptionFocus
): RoleDisruptionAnalysis {
  const profile = profileForFocus(result, focus);
  const status = resolveDisruptionStatus(profile);

  return {
    focus,
    roleLabel: focus === "current" ? "Current Role" : "Target Role",
    roleTitle: roleTitleForFocus(result, focus),
    status,
    statusSummary: STATUS_SUMMARY[status],
    resilienceScore: profile.resilienceScore,
    whyThisStatus: {
      title: `Why This Role Is ${status}`,
      intro: whyIntro(status),
      bullets: whyBullets(profile, status),
    },
    durableValue: {
      title: durableTitle(status),
      bullets: durableBullets(profile, status),
    },
    skillsBecomingImportant: {
      title: "Skills Becoming More Important",
      bullets: skillsBullets(profile, status),
    },
    keyOpportunity: {
      title: "Key Opportunity",
      bullets: opportunityBullets(profile, status),
    },
    outlook: OUTLOOK_BY_STATUS[status],
  };
}
