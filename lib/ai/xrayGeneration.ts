export const XRAY_PROMPT_VERSION = "xray-v1-openrouter";

export type XrayGenerationJson = {
  report: {
    currentRole: string;
    targetRole: string;
    futureReadinessScore: number;
    transitionFit: "Strong" | "Moderate" | "Weak";
    transitionDifficulty: "Low" | "Medium" | "High";
    estimatedTransitionTime: string;
    currentSalaryRange: string;
    targetSalaryRange: string;
    salaryUpside: string;
    transferableStrengths: Array<{ name: string; whyItMatters: string }>;
    skillGaps: Array<{
      skill: string;
      gap: "Small Gap" | "Moderate Gap" | "Large Gap";
      impact: "Medium Impact" | "High Impact";
      whyItMatters: string;
    }>;
    recommendedAction: { primaryAction: string; why: string };
    transitionSnapshot: {
      readinessScore: number;
      transitionDifficulty: "Low" | "Medium" | "High";
      estimatedTransitionTime: string;
      salaryUpside: string;
      marketDemand: string;
    };
  };
  opportunities: {
    recommendedRoles: Array<{
      title: string;
      matchScore: number;
      difficulty: "Low" | "Medium" | "High";
      transitionTime: string;
      salaryRange: string;
      whyFits: string;
      missingSkills: string[];
    }>;
  };
};

export function buildXrayPrompt(input: {
  currentRole: string;
  targetRole: string;
  industry?: string | null;
  skills?: string | null;
  summary?: string | null;
  scanResultJson?: unknown;
}): { system: string; user: string } {
  const system = `You are Future Trace generating a paid Career X-Ray report.
Return ONLY valid JSON matching the schema. No markdown fences.

Schema:
{
  "report": {
    "currentRole": string,
    "targetRole": string,
    "futureReadinessScore": number (0-100),
    "transitionFit": "Strong" | "Moderate" | "Weak",
    "transitionDifficulty": "Low" | "Medium" | "High",
    "estimatedTransitionTime": string,
    "currentSalaryRange": string,
    "targetSalaryRange": string,
    "salaryUpside": string,
    "transferableStrengths": [{"name": string, "whyItMatters": string}] (3-5),
    "skillGaps": [{"skill": string, "gap": "Small Gap"|"Moderate Gap"|"Large Gap", "impact": "Medium Impact"|"High Impact", "whyItMatters": string}] (3-5),
    "recommendedAction": {"primaryAction": string, "why": string},
    "transitionSnapshot": {
      "readinessScore": number,
      "transitionDifficulty": "Low"|"Medium"|"High",
      "estimatedTransitionTime": string,
      "salaryUpside": string,
      "marketDemand": string
    }
  },
  "opportunities": {
    "recommendedRoles": [{"title": string, "matchScore": number, "difficulty": "Low"|"Medium"|"High", "transitionTime": string, "salaryRange": string, "whyFits": string, "missingSkills": string[]}] (exactly 5 roles)
  }
}`;

  const user = `Generate a Career X-Ray for:
Current role: ${input.currentRole}
Target role: ${input.targetRole}
Industry: ${input.industry ?? "General"}
Skills: ${input.skills ?? "Not specified"}
Scan summary: ${input.summary ?? "N/A"}
Prior scan JSON: ${input.scanResultJson ? JSON.stringify(input.scanResultJson).slice(0, 4000) : "N/A"}`;

  return { system, user };
}

export function parseXrayGeneration(raw: string): XrayGenerationJson {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenceMatch?.[1]?.trim() ?? trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);
  const parsed = JSON.parse(jsonText) as XrayGenerationJson;

  if (!parsed.report || !parsed.opportunities?.recommendedRoles?.length) {
    throw new Error("X-Ray JSON missing report or recommendedRoles");
  }
  return parsed;
}
