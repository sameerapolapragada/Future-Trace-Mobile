import {
  buildAccessContext,
  orchestrate,
} from "../../../lib/ai/orchestrator.ts";
import {
  callOpenRouterWithFallback,
  resolveOpenRouterModelChain,
} from "../../../lib/ai/openrouter.ts";
import {
  buildScanPrompt,
  parseScanGeneration,
  SCAN_PROMPT_VERSION,
  type FreeScanResultJson,
  type ScanFormPayload,
} from "../../../lib/ai/scanGeneration.ts";
import { env } from "../env.ts";
import { logLlmJob } from "../lib/llmJobs.ts";
import { restGetWithUserJwt, restPostWithUserJwt } from "../lib/supabaseRest.ts";

const FREE_SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_SCANS_PER_WEEK = 1;

type EntitlementsRow = {
  has_radar: boolean | null;
  subscription_expires_at: string | null;
};

type UsageLimitRow = { count: number };

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
};

type ScanInsertRow = { id: string };

export class ScanQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanQuotaError";
  }
}

function normalizeWorkPreference(value: string): string {
  const lower = value.trim().toLowerCase();
  if (lower === "technical" || lower === "business" || lower === "hybrid") return lower;
  return "hybrid";
}

async function loadAccessContextForUser(token: string, userId: string) {
  const entitlements = await restGetWithUserJwt<EntitlementsRow[]>(
    token,
    `user_entitlements?user_id=eq.${userId}&select=has_radar,subscription_expires_at`
  );

  const row = entitlements[0];
  const hasRadar = row?.has_radar === true;
  const expiresAt = row?.subscription_expires_at ?? null;
  const hasTransition =
    hasRadar && (expiresAt === null || new Date(expiresAt).getTime() > Date.now());

  return buildAccessContext({
    hasTransitionSubscription: hasTransition,
    hasCareerXrayPurchase: false,
    hasExistingScanResult: false,
  });
}

async function assertCanRunFreeScan(token: string, userId: string): Promise<void> {
  const subs = await restGetWithUserJwt<SubscriptionRow[]>(
    token,
    `subscriptions?user_id=eq.${userId}&status=eq.active&select=status,current_period_end&limit=1`
  );

  if (subs.length > 0) {
    const end = subs[0]?.current_period_end;
    if (!end || new Date(end).getTime() > Date.now()) return;
  }

  const windowStart = new Date(Date.now() - FREE_SCAN_WINDOW_MS).toISOString();
  const limits = await restGetWithUserJwt<UsageLimitRow[]>(
    token,
    `usage_limits?user_id=eq.${userId}&action_type=eq.free_scan&window_end=gte.${encodeURIComponent(windowStart)}&select=count&order=window_start.desc&limit=1`
  );

  if ((limits[0]?.count ?? 0) >= FREE_SCANS_PER_WEEK) {
    throw new ScanQuotaError("Your next free scan will be available in a few days.");
  }
}

async function persistScan(
  token: string,
  userId: string,
  input: ScanFormPayload,
  inputHash: string,
  result: FreeScanResultJson,
  llmJobId: string | null
): Promise<string> {
  const yearsNum = Math.min(60, Math.max(0, parseInt(input.yearsExperience, 10) || 0));
  const workPreference = normalizeWorkPreference(input.workPreference);

  const rows = await restPostWithUserJwt<ScanInsertRow[]>(token, "career_scans", {
    user_id: userId,
    status: "complete",
    input_hash: inputHash,
    prompt_version: SCAN_PROMPT_VERSION,
    llm_job_id: llmJobId,
    current_role: input.currentRole.trim(),
    target_role: input.targetRole.trim(),
    industry: input.industry.trim() || null,
    years_experience: input.yearsExperience.trim() || null,
    skills: input.skills.trim() || null,
    tools: input.tools.trim() || null,
    career_goal: input.careerGoal.trim() || null,
    work_preference: workPreference,
    free_result_json: result,
    result,
    resilience_score: result.currentRoleProfile.resilienceScore,
    ai_exposure_level: result.currentRoleProfile.aiExposureLevel,
    summary: result.summary,
  });

  const scanId = rows[0]?.id;
  if (!scanId) throw new Error("Failed to create scan row");

  await restPostWithUserJwt(
    token,
    "scan_inputs",
    {
      scan_id: scanId,
      job_title_raw: input.currentRole.trim(),
      industry_raw: input.industry.trim() || "General",
      years_experience: yearsNum,
      current_skills_text: input.skills.trim() || "—",
      tools_used_text: input.tools.trim() || "—",
      career_goal_text: input.careerGoal.trim() || input.targetRole.trim(),
      work_preference: workPreference,
    },
    "return=minimal"
  );

  await Promise.all([
    restPostWithUserJwt(
      token,
      "scan_strengths",
      result.currentRoleProfile.strengths.map((label, sort_order) => ({
        scan_id: scanId,
        label,
        sort_order,
      })),
      "return=minimal"
    ),
    restPostWithUserJwt(
      token,
      "scan_vulnerabilities",
      result.currentRoleProfile.vulnerabilities.map((label, sort_order) => ({
        scan_id: scanId,
        label,
        sort_order,
      })),
      "return=minimal"
    ),
    restPostWithUserJwt(
      token,
      "scan_opportunity_zones",
      result.currentRoleProfile.opportunityZones.map((label, sort_order) => ({
        scan_id: scanId,
        label,
        sort_order,
      })),
      "return=minimal"
    ),
  ]);

  return scanId;
}

export type CreateScanInput = ScanFormPayload & {
  inputHash?: string;
  cacheKey?: string;
  modelTier?: string;
};

export async function createCareerScan(
  token: string,
  userId: string,
  body: CreateScanInput
): Promise<{
  scanId: string;
  model: string;
  modelChainAttempted: string[];
  promptVersion: string;
}> {
  if (!body.currentRole.trim()) {
    throw new Error("currentRole is required");
  }

  const targetRole = body.targetRole.trim() || body.careerGoal.trim() || body.currentRole.trim();
  const payload: ScanFormPayload = { ...body, targetRole };
  const inputHash =
    body.inputHash?.trim() ||
    `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const context = await loadAccessContextForUser(token, userId);
  const route = orchestrate("career_profile_scan", context, { cacheKey: body.cacheKey });

  if (!route.allowed) {
    throw new Error(route.reason ?? "Scan not allowed");
  }

  if (body.modelTier === "gemini_flash" || context.hasTransitionSubscription) {
    throw new Error("Subscriber Gemini scan generation is not wired yet.");
  }

  await assertCanRunFreeScan(token, userId);

  const openRouterKey = env("OPENROUTER_API_KEY");
  if (!openRouterKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const completion = await callOpenRouterWithFallback(
    {
      apiKey: openRouterKey,
      siteUrl: env("OPENROUTER_SITE_URL") ?? "http://localhost:5173",
      appName: env("OPENROUTER_APP_NAME") ?? "Future Trace",
      modelChain: route.modelChain ?? resolveOpenRouterModelChain(process.env as Record<string, string>),
      timeoutMs: 120_000,
    },
    {
      messages: buildScanPrompt(payload),
      responseFormat: { type: "json_object" },
      temperature: 0.5,
      maxTokens: 4096,
    }
  );

  const parsed = parseScanGeneration(completion.content);

  const llmJobId = await logLlmJob({
    jobType: "career_scan",
    userId,
    relatedEntityType: "career_scan",
    model: completion.model,
    promptVersion: SCAN_PROMPT_VERSION,
    inputTokens: completion.usage?.promptTokens,
    outputTokens: completion.usage?.completionTokens,
    rawResponse: {
      modelChainAttempted: completion.modelChainAttempted,
      summary: parsed.summary,
    },
  });

  try {
    const scanId = await persistScan(token, userId, payload, inputHash, parsed, llmJobId);
    return {
      scanId,
      model: completion.model,
      modelChainAttempted: completion.modelChainAttempted,
      promptVersion: SCAN_PROMPT_VERSION,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save scan";
    if (message.includes("duplicate key") || message.includes("23505")) {
      throw new Error("You already ran a scan with these details.");
    }
    throw err;
  }
}

export async function getCareerScan(token: string, userId: string, scanId: string) {
  const rows = await restGetWithUserJwt<
    Array<{
      id: string;
      user_id: string;
      status: string;
      free_result_json: unknown;
      result: unknown;
      summary: string | null;
      created_at: string;
    }>
  >(
    token,
    `career_scans?id=eq.${scanId}&user_id=eq.${userId}&select=id,user_id,status,free_result_json,result,summary,created_at`
  );

  return rows[0] ?? null;
}
