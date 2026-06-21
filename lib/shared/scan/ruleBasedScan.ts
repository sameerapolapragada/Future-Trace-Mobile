import type {
  AIExposureLevel,
  FreeScanResult,
  NormalizedScanInput,
  RoleScanProfile,
} from "../types";
import { formatRoleLabel } from "./inferTargetRole";

type RoleArchetype = {
  resilience: number;
  exposure: AIExposureLevel;
  exposureLabel: string;
  strengthSeeds: string[];
  vulnerabilitySeeds: string[];
  opportunitySeeds: string[];
};

const DEFAULT_ARCHETYPE: RoleArchetype = {
  resilience: 58,
  exposure: "medium",
  exposureLabel: "Moderate automation risk",
  strengthSeeds: ["Adaptable skill mix", "Cross-functional experience", "Problem-solving mindset"],
  vulnerabilitySeeds: ["Routine tasks may shift", "Tooling changes quickly", "Need continuous learning"],
  opportunitySeeds: ["AI-assisted workflows", "Adjacent role paths", "Process improvement"],
};

function matchArchetype(role: string): RoleArchetype {
  const r = role.toLowerCase();

  if (/ai engineer|ml engineer|machine learning|data scientist|prompt engineer|llm/.test(r)) {
    return {
      resilience: 82,
      exposure: "medium",
      exposureLabel: "Moderate automation risk",
      strengthSeeds: ["High demand for AI skills", "Technical depth", "Rapid tool adoption"],
      vulnerabilitySeeds: ["Fast-changing stack", "High competition at entry level", "Specialization risk"],
      opportunitySeeds: ["MLOps", "Applied AI products", "AI governance"],
    };
  }

  if (/salesforce|crm admin|platform admin|business analyst|administrator/.test(r)) {
    return {
      resilience: 66,
      exposure: "medium",
      exposureLabel: "Rising platform automation",
      strengthSeeds: ["Platform certifications", "Business process knowledge", "Stakeholder coordination"],
      vulnerabilitySeeds: ["Declarative automation reduces manual config", "AI copilots in CRM", "Commodity admin tasks"],
      opportunitySeeds: ["RevOps analytics", "AI operations", "Solution architecture"],
    };
  }

  if (/product manager|project manager|program manager|consultant|strategy/.test(r)) {
    return {
      resilience: 72,
      exposure: "low",
      exposureLabel: "Lower displacement risk",
      strengthSeeds: ["Judgment-heavy work", "Cross-team influence", "Customer context"],
      vulnerabilitySeeds: ["Reporting automation", "Status synthesis by AI", "Competition from generalists"],
      opportunitySeeds: ["AI product strategy", "Change leadership", "Portfolio management"],
    };
  }

  if (/developer|engineer|software|devops|sre|architect/.test(r)) {
    return {
      resilience: 76,
      exposure: "medium",
      exposureLabel: "Moderate automation risk",
      strengthSeeds: ["Build and ship capability", "Systems thinking", "Debugging skills"],
      vulnerabilitySeeds: ["Code generation tools", "Boilerplate automation", "Offshore competition"],
      opportunitySeeds: ["Platform engineering", "Security", "AI-augmented delivery"],
    };
  }

  if (/support|customer success|operations coordinator|coordinator/.test(r)) {
    return {
      resilience: 52,
      exposure: "high",
      exposureLabel: "Higher automation exposure",
      strengthSeeds: ["Customer empathy", "Process knowledge", "Issue triage"],
      vulnerabilitySeeds: ["Chatbot deflection", "Ticket automation", "Scripted workflows"],
      opportunitySeeds: ["Success engineering", "Implementation", "Training roles"],
    };
  }

  return DEFAULT_ARCHETYPE;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(1, Math.round(value)));
}

function tokenizeSkills(text: string): string[] {
  return text
    .split(/[,;\n/|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s !== "—")
    .slice(0, 8);
}

function buildProfile(
  role: string,
  input: NormalizedScanInput,
  isTarget: boolean
): RoleScanProfile {
  const archetype = matchArchetype(role);
  const skills = tokenizeSkills(input.skills);
  const yearsBonus = Math.min(12, Math.floor(input.yearsExperience / 3));

  let resilience = archetype.resilience + yearsBonus;
  if (input.workPreference === "technical" && /engineer|developer|data|ai|ml/.test(role.toLowerCase())) {
    resilience += 4;
  }
  if (input.workPreference === "business" && /manager|analyst|consultant/.test(role.toLowerCase())) {
    resilience += 3;
  }

  if (isTarget) {
    const gap = transitionGapScore(input.currentRole, role);
    resilience = clampScore(resilience - Math.floor(gap / 8));
  } else {
    resilience = clampScore(resilience);
  }

  const strengths = [
    ...skills.slice(0, 2).map((s) => `Strong ${s} experience`),
    ...archetype.strengthSeeds.slice(0, 3),
  ].slice(0, 4);

  const vulnerabilities = [
    ...(isTarget && transitionGapScore(input.currentRole, role) > 40
      ? [`Skill gap for ${formatRoleLabel(role)} transition`]
      : []),
    ...archetype.vulnerabilitySeeds.slice(0, 3),
  ].slice(0, 4);

  const opportunities = [
    ...archetype.opportunitySeeds.slice(0, 2),
    input.industry !== "General"
      ? `Growing demand in ${input.industry}`
      : "Explore adjacent roles in your industry",
  ].slice(0, 4);

  return {
    resilienceScore: resilience,
    aiExposureLevel: archetype.exposure,
    aiExposureLabel: archetype.exposureLabel,
    strengths,
    vulnerabilities,
    opportunityZones: opportunities,
  };
}

function transitionGapScore(fromRole: string, toRole: string): number {
  const from = matchArchetype(fromRole);
  const to = matchArchetype(toRole);
  const resilienceDelta = Math.abs(from.resilience - to.resilience);
  const exposureDelta =
    from.exposure === to.exposure ? 0 : from.exposure === "high" || to.exposure === "high" ? 15 : 8;
  const lexical =
    fromRole.toLowerCase().split(/\s+/).some((w) => toRole.toLowerCase().includes(w)) ? -10 : 20;
  return clampScore(30 + resilienceDelta + exposureDelta + lexical);
}

function buildRecommendations(input: NormalizedScanInput): string[] {
  const target = input.targetRole;
  const recs = [target];

  if (/salesforce|admin|crm/i.test(input.currentRole)) {
    recs.push("RevOps Analyst", "AI Operations Specialist", "Business Systems Analyst");
  } else if (/engineer|developer/i.test(input.currentRole)) {
    recs.push("Platform Engineer", "ML Engineer", "Technical Product Manager");
  } else {
    recs.push("Operations Analyst", "Product Coordinator", "Customer Success Engineer");
  }

  return [...new Set(recs.map((r) => formatRoleLabel(r)))].slice(0, 3);
}

function buildSummary(input: NormalizedScanInput, current: RoleScanProfile, target: RoleScanProfile): string {
  const gap = transitionGapScore(input.currentRole, input.targetRole);
  const difficulty =
    gap >= 55 ? "a meaningful transition that will take focused upskilling" : "a realistic next step with steady preparation";

  return `Your scan compares ${formatRoleLabel(input.currentRole)} with a target of ${formatRoleLabel(input.targetRole)} in ${input.industry}. Your current role shows a resilience score of ${current.resilienceScore}/100 with ${current.aiExposureLabel.toLowerCase()}. Moving toward your target (${target.resilienceScore}/100 resilience) looks like ${difficulty}. This is informational guidance only—not a hiring guarantee or financial advice.`;
}

/** Phase 1 rule-based Career Scan — no external LLM. */
export function generateRuleBasedScan(input: NormalizedScanInput): FreeScanResult {
  const currentRoleProfile = buildProfile(input.currentRole, input, false);
  const targetRoleProfile = buildProfile(input.targetRole, input, true);

  return {
    currentRole: formatRoleLabel(input.currentRole),
    targetRole: formatRoleLabel(input.targetRole),
    currentRoleProfile,
    targetRoleProfile,
    summary: buildSummary(input, currentRoleProfile, targetRoleProfile),
    initialRoleRecommendations: buildRecommendations(input),
  };
}
