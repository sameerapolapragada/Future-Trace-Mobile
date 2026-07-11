import type { CareerDirectionRecommendation } from "../types";

export type NextRoleTransitionStep = {
  title: string;
  duration: string;
};

export type NextRoleDetailModel = {
  fitLabel: string;
  whyFit: string[];
  skillsNeeded: string[];
  transitionSteps: NextRoleTransitionStep[];
  salaryDisplay: string;
  salaryCaption: string;
};

function fitLabelFromScore(score: number): string {
  if (score >= 90) return "Excellent Fit";
  if (score >= 80) return "Strong Fit";
  if (score >= 70) return "Good Fit";
  return "Promising Fit";
}

function formatFullSalary(item: CareerDirectionRecommendation): string {
  if (item.avgNationalSalaryUsd != null) {
    return `$${item.avgNationalSalaryUsd.toLocaleString("en-US")}`;
  }
  if (item.salaryRangeUsd) {
    const mid = Math.round((item.salaryRangeUsd.min + item.salaryRangeUsd.max) / 2);
    return `$${mid.toLocaleString("en-US")}`;
  }
  return item.salaryLabel ?? "—";
}

function whyFitFromRecommendation(item: CareerDirectionRecommendation): string[] {
  const skills = (item.transferableSkills ?? []).slice(0, 4);
  if (skills.length > 0) {
    return skills.map((skill) => {
      const lower = skill.toLowerCase();
      if (lower.includes("you ")) return skill;
      return `You already bring ${lower}`;
    });
  }

  const parts = item.why
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12)
    .slice(0, 4);

  return parts.length > 0 ? parts : ["Your current experience aligns well with this path."];
}

function skillsNeededForRole(role: string): string[] {
  const lower = role.toLowerCase();

  if (/salesforce|agentforce|revenue cloud/.test(lower)) {
    return [
      "Prompt Builder",
      "Agentforce & AI Concepts",
      "Einstein Analytics",
      "AI Ethics & Governance",
    ];
  }
  if (/data scientist|machine learning|ml /.test(lower)) {
    return ["Python for ML", "Model evaluation basics", "Feature engineering", "Responsible AI practices"];
  }
  if (/data analyst|analytics engineer|bi /.test(lower)) {
    return ["Advanced SQL", "Dashboard storytelling", "AI-assisted analytics", "Data quality checks"];
  }
  if (/product manager|product owner/.test(lower)) {
    return ["AI product sense", "Experiment design", "Roadmap prioritization", "Stakeholder alignment"];
  }
  if (/business analyst/.test(lower)) {
    return ["AI use-case framing", "Process mining basics", "Requirements for AI tools", "Change enablement"];
  }
  if (/qa|test|quality/.test(lower)) {
    return ["AI test strategy", "Prompt evaluation", "Automation frameworks", "Risk-based testing"];
  }
  if (/devops|sre|platform|cloud|full stack|frontend|backend|developer|engineer/.test(lower)) {
    return ["AI-assisted coding", "Observability for AI systems", "Secure deployment patterns", "API integration"];
  }
  if (/scrum|project|program/.test(lower)) {
    return ["AI delivery rituals", "Risk tracking for AI work", "Vendor evaluation", "Team enablement plans"];
  }
  if (/cyber|security/.test(lower)) {
    return ["AI threat modeling", "Model risk controls", "Identity for AI agents", "Governance frameworks"];
  }

  return [
    "AI tooling fundamentals",
    "Automation design patterns",
    "Data literacy for AI",
    "Responsible AI practices",
  ];
}

function transitionStepsForRole(
  item: CareerDirectionRecommendation
): NextRoleTransitionStep[] {
  const role = item.role;
  const lower = role.toLowerCase();
  const months = item.transitionMonths ?? { min: 2, max: 4 };

  if (/salesforce|agentforce/.test(lower)) {
    return [
      { title: "Learn Prompt Builder & Agentforce", duration: "2–3 weeks" },
      { title: "Build AI automation use cases", duration: "3–4 weeks" },
      { title: "Create portfolio of AI solutions", duration: "4–6 weeks" },
    ];
  }

  if (/data|analytics|scientist/.test(lower)) {
    return [
      { title: "Strengthen analytics / AI fundamentals", duration: "2–3 weeks" },
      { title: "Ship one portfolio analysis project", duration: "3–5 weeks" },
      { title: "Practice storytelling with stakeholders", duration: "2–4 weeks" },
    ];
  }

  if (/product/.test(lower)) {
    return [
      { title: "Map AI opportunities in your domain", duration: "2–3 weeks" },
      { title: "Draft a lightweight product brief", duration: "2–4 weeks" },
      { title: "Run discovery with 3–5 users", duration: "3–5 weeks" },
    ];
  }

  const midWeeks = Math.max(2, Math.round(((months.min + months.max) / 2) * 4));
  return [
    { title: `Learn core tools for ${role}`, duration: "2–3 weeks" },
    { title: "Apply skills on a real workflow", duration: "3–4 weeks" },
    { title: "Package proof of work for interviews", duration: `${Math.max(3, midWeeks - 4)}–${midWeeks} weeks` },
  ];
}

/** Build detail-panel content for a next-role recommendation. */
export function buildNextRoleDetailModel(item: CareerDirectionRecommendation): NextRoleDetailModel {
  return {
    fitLabel: fitLabelFromScore(item.transferabilityScore),
    whyFit: whyFitFromRecommendation(item),
    skillsNeeded: skillsNeededForRole(item.role),
    transitionSteps: transitionStepsForRole(item),
    salaryDisplay: formatFullSalary(item),
    salaryCaption: "Avg Salary (USA)",
  };
}
