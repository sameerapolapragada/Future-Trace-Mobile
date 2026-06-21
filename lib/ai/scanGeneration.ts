import type { OpenRouterMessage } from "./openrouter";

export const SCAN_PROMPT_VERSION = "scan-v2-openrouter-calibrated";

export type AIExposureLevel = "low" | "medium" | "high";

export type RoleScanProfileJson = {
  resilienceScore: number;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
};

export type XrayPreviewJson = {
  readinessScore: number;
  transitionDifficulty: "low" | "medium" | "high";
  topRoleTeaser: string;
  unlockMessage: string;
};

export type FreeScanResultJson = {
  currentRole: string;
  targetRole: string;
  currentRoleProfile: RoleScanProfileJson;
  targetRoleProfile: RoleScanProfileJson;
  summary: string;
  initialRoleRecommendations: string[];
  xrayPreview: XrayPreviewJson;
};

export type ScanFormPayload = {
  currentRole: string;
  targetRole: string;
  industry: string;
  yearsExperience: string;
  skills: string;
  tools: string;
  careerGoal: string;
  workPreference: string;
};

export function buildScanPrompt(input: ScanFormPayload): OpenRouterMessage[] {
  const system = `You are Future Trace, an AI career intelligence assistant.
Analyze the user's current role and target career direction.
Return ONLY valid JSON matching the schema below — no markdown fences, no commentary.

Schema:
{
  "currentRole": string,
  "targetRole": string,
  "currentRoleProfile": {
    "resilienceScore": number (0-100),
    "aiExposureLevel": "low" | "medium" | "high",
    "aiExposureLabel": string (short phrase),
    "strengths": string[3-5],
    "vulnerabilities": string[3-5],
    "opportunityZones": string[3-5]
  },
  "targetRoleProfile": { same shape as currentRoleProfile for the TARGET role },
  "summary": string (2-3 sentences, encouraging, specific to their inputs),
  "initialRoleRecommendations": string[3] (adjacent roles they could transition toward),
  "xrayPreview": {
    "readinessScore": number (0-100),
    "transitionDifficulty": "low" | "medium" | "high",
    "topRoleTeaser": string (one compelling target role + why, 1 sentence — full X-Ray is paid),
    "unlockMessage": string (one line teasing the full Career X-Ray report for $1.99)
  }
}

Rules:
- Be specific to their industry, skills, tools, and career goal.
- Do not invent credentials they did not provide.
- Keep tone professional and actionable.
- initialRoleRecommendations are free-tier teasers; full top-5 roles are in the paid X-Ray.

Metric definitions (apply separately to currentRoleProfile and targetRoleProfile):

resilienceScore (0-100): Future-career durability for this role — labor demand, skill transferability, and adaptability as AI reshapes work.
- 70–100: Strong long-term demand and adaptability (e.g. AI Engineer, ML Engineer, solutions architect).
- 40–69: Moderate durability; upskilling required (e.g. Salesforce Administrator, business analyst).
- 1–39: Significant headwinds; only use when the role is genuinely at risk. Never use 0 unless the role is effectively obsolete.

aiExposureLevel: Automation / displacement risk for typical tasks in this role — NOT how much the job uses AI tools.
- low: Mostly judgment, relationships, governance, or compliance; limited automation of core work.
- medium: Mix of automatable tasks and human oversight (typical for admins, analysts, coordinators).
- high: Many core tasks can be automated or heavily AI-assisted soon.

aiExposureLabel: A short 2–5 word phrase describing automation/displacement risk only (e.g. "Moderate automation risk", "Rising platform automation"). Do NOT name tech stacks, tools, or "uses AI/ML".

Calibration (illustrative, adjust to their inputs):
- Salesforce Administrator: resilience often 55–75; exposure usually medium (platform automation is increasing, not minimal).
- AI Engineer (as target role): resilience often 72–90; exposure usually medium (field changes fast but demand is strong). Do NOT score AI Engineer resilience near 0 or describe exposure as "full AI stack".`;

  const user = `Current role: ${input.currentRole.trim()}
Target role: ${input.targetRole.trim()}
Industry: ${input.industry.trim() || "General"}
Years of experience: ${input.yearsExperience.trim() || "0"}
Skills: ${input.skills.trim() || "Not specified"}
Tools: ${input.tools.trim() || "Not specified"}
Career goal: ${input.careerGoal.trim() || input.targetRole.trim()}
Work preference: ${input.workPreference.trim() || "Hybrid"}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseScanGeneration(raw: string): FreeScanResultJson {
  const jsonText = extractJsonObject(raw);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  const currentRole = requiredString(parsed.currentRole, "currentRole");
  const targetRole = requiredString(parsed.targetRole, "targetRole");
  const summary = requiredString(parsed.summary, "summary");

  return {
    currentRole,
    targetRole,
    summary,
    currentRoleProfile: parseRoleProfile(parsed.currentRoleProfile, "currentRoleProfile"),
    targetRoleProfile: parseRoleProfile(parsed.targetRoleProfile, "targetRoleProfile"),
    initialRoleRecommendations: parseStringArray(parsed.initialRoleRecommendations, 3, 5),
    xrayPreview: parseXrayPreview(parsed.xrayPreview),
  };
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Scan JSON missing ${field}`);
  }
  return value.trim();
}

function parseRoleProfile(value: unknown, field: string): RoleScanProfileJson {
  if (!value || typeof value !== "object") {
    throw new Error(`Scan JSON missing ${field}`);
  }
  const row = value as Record<string, unknown>;
  const level = row.aiExposureLevel;
  if (level !== "low" && level !== "medium" && level !== "high") {
    throw new Error(`${field}.aiExposureLevel must be low, medium, or high`);
  }

  return {
    resilienceScore: clampScore(row.resilienceScore),
    aiExposureLevel: level,
    aiExposureLabel: requiredString(row.aiExposureLabel, `${field}.aiExposureLabel`),
    strengths: parseStringArray(row.strengths, 2, 6),
    vulnerabilities: parseStringArray(row.vulnerabilities, 2, 6),
    opportunityZones: parseStringArray(row.opportunityZones, 2, 6),
  };
}

function parseXrayPreview(value: unknown): XrayPreviewJson {
  if (!value || typeof value !== "object") {
    throw new Error("Scan JSON missing xrayPreview");
  }
  const row = value as Record<string, unknown>;
  const difficulty = row.transitionDifficulty;
  if (difficulty !== "low" && difficulty !== "medium" && difficulty !== "high") {
    throw new Error("xrayPreview.transitionDifficulty must be low, medium, or high");
  }

  return {
    readinessScore: clampScore(row.readinessScore),
    transitionDifficulty: difficulty,
    topRoleTeaser: requiredString(row.topRoleTeaser, "xrayPreview.topRoleTeaser"),
    unlockMessage: requiredString(row.unlockMessage, "xrayPreview.unlockMessage"),
  };
}

function parseStringArray(value: unknown, min: number, max: number): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected string array in scan JSON");
  }
  const items = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max);

  if (items.length < min) {
    throw new Error(`Expected at least ${min} string items in scan JSON array`);
  }
  return items;
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 50;
  return Math.min(100, Math.max(0, Math.round(num)));
}
