import {
  callOpenRouterWithFallback,
  resolveOpenRouterModelChain,
} from "../../../lib/ai/openrouter.ts";
import {
  buildXrayPrompt,
  parseXrayGeneration,
  XRAY_PROMPT_VERSION,
} from "../../../lib/ai/xrayGeneration.ts";
import { env } from "../env.ts";
import { logLlmJob } from "../lib/llmJobs.ts";
import { restGetWithUserJwt, restPatchWithUserJwt } from "../lib/supabaseRest.ts";

type ScanRow = {
  id: string;
  current_role: string | null;
  target_role: string | null;
  industry: string | null;
  skills: string | null;
  summary: string | null;
  free_result_json: unknown;
  result: unknown;
};

type XrayRow = {
  id: string;
  scan_id: string;
  user_id: string;
  status: string;
  xray_result_json: unknown;
};

export async function generateCareerXray(
  token: string,
  userId: string,
  scanId: string
): Promise<{ xrayId: string; model: string }> {
  const openRouterKey = env("OPENROUTER_API_KEY");
  if (!openRouterKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const scans = await restGetWithUserJwt<ScanRow[]>(
    token,
    `career_scans?id=eq.${scanId}&user_id=eq.${userId}&select=id,current_role,target_role,industry,skills,summary,free_result_json,result`
  );
  const scan = scans[0];
  if (!scan) throw new Error("Scan not found");

  const xrays = await restGetWithUserJwt<XrayRow[]>(
    token,
    `career_xrays?scan_id=eq.${scanId}&user_id=eq.${userId}&select=id,scan_id,user_id,status,xray_result_json`
  );
  const xray = xrays[0];
  if (!xray) throw new Error("Career X-Ray record not found");
  if (xray.status === "generated" && xray.xray_result_json) {
    return { xrayId: xray.id, model: "existing" };
  }
  if (xray.status !== "paid" && xray.status !== "generated") {
    throw new Error("Payment required before generating Career X-Ray");
  }

  const scanResult = scan.free_result_json ?? scan.result;
  const prompt = buildXrayPrompt({
    currentRole: scan.current_role ?? "Unknown",
    targetRole: scan.target_role ?? "Unknown",
    industry: scan.industry,
    skills: scan.skills,
    summary: scan.summary,
    scanResultJson: scanResult,
  });

  const completion = await callOpenRouterWithFallback(
    {
      apiKey: openRouterKey,
      siteUrl: env("OPENROUTER_SITE_URL") ?? "http://localhost:5173",
      appName: env("OPENROUTER_APP_NAME") ?? "Future Trace",
      modelChain: resolveOpenRouterModelChain(process.env as Record<string, string>),
      timeoutMs: 120_000,
    },
    {
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.5,
      maxTokens: 8192,
    }
  );

  const parsed = parseXrayGeneration(completion.content);
  const now = new Date().toISOString();

  const llmJobId = await logLlmJob({
    jobType: "xray",
    userId,
    relatedEntityType: "career_xray",
    relatedEntityId: xray.id,
    model: completion.model,
    promptVersion: XRAY_PROMPT_VERSION,
    inputTokens: completion.usage?.promptTokens,
    outputTokens: completion.usage?.completionTokens,
    rawResponse: { scanId, modelChainAttempted: completion.modelChainAttempted },
  });

  await restPatchWithUserJwt(token, "career_xrays", `id=eq.${xray.id}`, {
    status: "generated",
    xray_result_json: parsed,
    generated_at: now,
    readiness_score: parsed.report.futureReadinessScore,
    transition_difficulty: parsed.report.transitionDifficulty.toLowerCase(),
    estimated_transition_time: parsed.report.estimatedTransitionTime,
    salary_upside: parsed.report.salaryUpside,
    market_demand: parsed.report.transitionSnapshot.marketDemand,
  });

  return { xrayId: xray.id, model: completion.model };
}
