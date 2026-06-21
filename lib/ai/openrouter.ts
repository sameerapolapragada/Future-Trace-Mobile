import { FREE_TIER_MODEL_CHAIN, MODEL_IDS } from "./models";
import type { AiModelId } from "./types";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterConfig = {
  apiKey: string;
  /** Recommended by OpenRouter — e.g. https://app.futuretrace.com */
  siteUrl?: string;
  /** Recommended by OpenRouter — e.g. Future Trace */
  appName?: string;
  /** Defaults to FREE_TIER_MODEL_CHAIN (120B → 20B → openrouter/free). */
  modelChain?: readonly AiModelId[];
  timeoutMs?: number;
};

export type OpenRouterCallOptions = {
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
};

export type OpenRouterUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type OpenRouterCompletionResult = {
  content: string;
  model: AiModelId;
  modelChainAttempted: AiModelId[];
  usage?: OpenRouterUsage;
};

export class OpenRouterCallError extends Error {
  readonly status: number;
  readonly model: AiModelId;
  readonly retryable: boolean;
  readonly responseBody?: string;

  constructor(
    message: string,
    opts: { status: number; model: AiModelId; retryable: boolean; responseBody?: string }
  ) {
    super(message);
    this.name = "OpenRouterCallError";
    this.status = opts.status;
    this.model = opts.model;
    this.retryable = opts.retryable;
    this.responseBody = opts.responseBody;
  }
}

/** Resolve model chain from env — BFF passes `process.env`. */
export function resolveOpenRouterModelChain(
  env: Record<string, string | undefined> = {}
): AiModelId[] {
  return [
    (env.OPENROUTER_PRIMARY_MODEL?.trim() || MODEL_IDS.GPT_OSS_120B) as AiModelId,
    (env.OPENROUTER_FALLBACK_MODEL?.trim() || MODEL_IDS.GPT_OSS_20B) as AiModelId,
    (env.OPENROUTER_FREE_ROUTER_MODEL?.trim() || MODEL_IDS.OPENROUTER_FREE_ROUTER) as AiModelId,
  ];
}

export function isRetryableOpenRouterError(status: number, body?: string): boolean {
  if (status === 429 || status === 502 || status === 503 || status === 504) return true;
  if (status === 404) return true;
  if (!body) return false;
  const lower = body.toLowerCase();
  return (
    lower.includes("no endpoints found") ||
    lower.includes("provider returned error") ||
    lower.includes("model not found") ||
    lower.includes("temporarily unavailable")
  );
}

type OpenRouterChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

/**
 * Try each model in the chain until one succeeds.
 * Use for all free-tier intelligence (scan, profile analysis, role recs, X-Ray preview).
 */
export async function callOpenRouterWithFallback(
  config: OpenRouterConfig,
  options: OpenRouterCallOptions
): Promise<OpenRouterCompletionResult> {
  const chain = config.modelChain ?? FREE_TIER_MODEL_CHAIN;
  const attempted: AiModelId[] = [];
  let lastError: Error | null = null;

  for (const model of chain) {
    attempted.push(model);
    try {
      const result = await callOpenRouterModel(config, model, options);
      return { ...result, modelChainAttempted: attempted };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("OpenRouter fallback chain exhausted");
}

async function callOpenRouterModel(
  config: OpenRouterConfig,
  model: AiModelId,
  options: OpenRouterCallOptions
): Promise<Omit<OpenRouterCompletionResult, "modelChainAttempted">> {
  const controller = new AbortController();
  const timeoutMs = config.timeoutMs ?? 90_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (config.siteUrl) headers["HTTP-Referer"] = config.siteUrl;
    if (config.appName) headers["X-Title"] = config.appName;

    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
    });

    const bodyText = await response.text();
    let parsed: OpenRouterChatResponse = {};
    try {
      parsed = bodyText ? (JSON.parse(bodyText) as OpenRouterChatResponse) : {};
    } catch {
      parsed = {};
    }

    if (!response.ok) {
      const message =
        parsed.error?.message ??
        (bodyText.slice(0, 500) || `OpenRouter request failed (${response.status})`);
      throw new OpenRouterCallError(message, {
        status: response.status,
        model,
        retryable: isRetryableOpenRouterError(response.status, bodyText),
        responseBody: bodyText,
      });
    }

    const content = parsed.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new OpenRouterCallError("OpenRouter returned empty content", {
        status: response.status,
        model,
        retryable: true,
        responseBody: bodyText,
      });
    }

    return {
      content,
      model: (parsed.model as AiModelId | undefined) ?? model,
      usage: parsed.usage
        ? {
            promptTokens: parsed.usage.prompt_tokens,
            completionTokens: parsed.usage.completion_tokens,
            totalTokens: parsed.usage.total_tokens,
          }
        : undefined,
    };
  } catch (err) {
    if (err instanceof OpenRouterCallError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new OpenRouterCallError(`OpenRouter timed out after ${timeoutMs}ms`, {
        status: 408,
        model,
        retryable: true,
      });
    }
    throw new OpenRouterCallError(err instanceof Error ? err.message : String(err), {
      status: 0,
      model,
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}
