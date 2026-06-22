import type { ExposureExplanation, ExposureScoreResult, ScoringInput } from "./types";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b:free";
const FALLBACK_MODEL = "openai/gpt-oss-20b:free";

export type ExplanationConfig = {
  apiKey?: string;
  model?: string;
  fallbackModel?: string;
  siteUrl?: string;
  appName?: string;
};

function buildPrompt(input: ScoringInput, score: ExposureScoreResult): string {
  return JSON.stringify(
    {
      role: input.currentRole,
      industry: input.industry,
      yearsExperience: input.yearsExperience,
      userSkills: input.skills,
      onetOccupationTitle: input.occupationTitle ?? input.currentRole,
      selectedTasks: input.tasks.slice(0, 6),
      fixedAiExposureScore: score.aiExposureScore,
      fixedExposureLevel: score.exposureLevel,
      keyExposureDrivers: score.keyExposureDrivers,
      protectedStrengths: score.protectedStrengths,
      affectedTasks: score.affectedTasks,
    },
    null,
    2
  );
}

const SYSTEM_PROMPT = `You are a career guidance assistant for Future Trace. The AI Exposure Score and exposure level are already calculated by Future Trace. Do not alter them. Only explain them.

Rules:
- Do NOT change the score or exposure level.
- Do NOT claim job replacement certainty.
- Do NOT claim guaranteed salary, hiring, or career outcomes.
- Do NOT invent live job market data, layoff statistics, or salary figures.
- Do NOT provide medical, legal, immigration, or financial advice.
- Avoid language like "AI will replace you."
- Keep explanations informational and balanced.

Respond with JSON only:
{
  "explanation": "2-3 sentences summarizing the fixed score in plain language",
  "whyThisLevel": "1-2 sentences on why this role has this exposure level",
  "tasksAffectedSummary": ["up to 4 short bullets on tasks that may see AI-assisted change"],
  "skillsToStrengthen": ["up to 4 practical skills to build next"]
}`;

function parseExplanation(raw: string): ExposureExplanation | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as ExposureExplanation;
    if (!parsed.explanation || !parsed.whyThisLevel) return null;
    return {
      explanation: String(parsed.explanation),
      whyThisLevel: String(parsed.whyThisLevel),
      tasksAffectedSummary: Array.isArray(parsed.tasksAffectedSummary)
        ? parsed.tasksAffectedSummary.map(String).slice(0, 4)
        : [],
      skillsToStrengthen: Array.isArray(parsed.skillsToStrengthen)
        ? parsed.skillsToStrengthen.map(String).slice(0, 4)
        : [],
    };
  } catch {
    return null;
  }
}

function templateExplanation(input: ScoringInput, score: ExposureScoreResult): ExposureExplanation {
  const occ = input.occupationTitle ? ` (${input.occupationTitle})` : "";
  return {
    explanation: `Your AI Exposure Score is ${score.aiExposureScore}/100 (${score.exposureLevel}) for ${input.currentRole}${occ}. This reflects how much of the mapped work involves routine, document-heavy, or data-processing tasks versus judgment-heavy or in-person work.`,
    whyThisLevel:
      score.keyExposureDrivers.length > 0
        ? `Key factors include ${score.keyExposureDrivers.join(", ").toLowerCase()}.`
        : `Your role profile shows a mixed balance of automatable and protected responsibilities.`,
    tasksAffectedSummary:
      score.affectedTasks.length > 0
        ? score.affectedTasks.slice(0, 4)
        : ["Routine documentation and reporting workflows may see increasing AI assistance over time."],
    skillsToStrengthen: [
      "Stakeholder communication and judgment-heavy problem solving",
      "Workflow design with AI-assisted tools",
      ...(input.skills.split(/[,;\n/|]+/).map((s) => s.trim()).filter(Boolean).slice(0, 2).map((s) => `Deepen ${s} expertise`)),
    ].slice(0, 4),
  };
}

async function callOpenRouter(
  model: string,
  userPayload: string,
  config: ExplanationConfig
): Promise<string | null> {
  if (!config.apiKey?.trim()) return null;

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(config.siteUrl ? { "HTTP-Referer": config.siteUrl } : {}),
      ...(config.appName ? { "X-Title": config.appName } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain the following fixed Future Trace exposure result:\n${userPayload}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? null;
}

/** Generate contextual explanation — OpenAI via OpenRouter free tier; template fallback on failure. */
export async function generateExposureExplanation(
  input: ScoringInput,
  score: ExposureScoreResult,
  config: ExplanationConfig = {}
): Promise<ExposureExplanation> {
  const payload = buildPrompt(input, score);
  const primary = config.model ?? DEFAULT_MODEL;
  const fallback = config.fallbackModel ?? FALLBACK_MODEL;

  try {
    let content = await callOpenRouter(primary, payload, config);
    if (!content) content = await callOpenRouter(fallback, payload, config);
    if (content) {
      const parsed = parseExplanation(content);
      if (parsed) return parsed;
    }
  } catch {
    // Use template fallback
  }

  return templateExplanation(input, score);
}

export { templateExplanation };
