import type { AiDataSource, AiModelId } from "./types";

export const MODEL_IDS = {
  STATIC: "static" as const,
  CACHE: "cache" as const,
  GPT_OSS_120B: "openai/gpt-oss-120b:free" as const,
  GPT_OSS_20B: "openai/gpt-oss-20b:free" as const,
  OPENROUTER_FREE_ROUTER: "openrouter/free" as const,
  GEMINI_FLASH: "google/gemini-2.5-flash" as const,
  GEMINI_PRO: "google/gemini-2.5-pro" as const,
} satisfies Record<string, AiModelId>;

/** Free-tier fallback chain — primary → fallback → OpenRouter free router. */
export const FREE_TIER_MODEL_CHAIN: readonly AiModelId[] = [
  MODEL_IDS.GPT_OSS_120B,
  MODEL_IDS.GPT_OSS_20B,
  MODEL_IDS.OPENROUTER_FREE_ROUTER,
];

/** @deprecated Use MODEL_IDS.GPT_OSS_120B — kept for env var docs compatibility. */
export const OPENROUTER_FREE_MODEL = MODEL_IDS.GPT_OSS_120B;

/** @deprecated Use MODEL_IDS.OPENROUTER_FREE_ROUTER */
export const OPENROUTER_FREE = MODEL_IDS.OPENROUTER_FREE_ROUTER;

export const GEMINI_FLASH_MODEL = MODEL_IDS.GEMINI_FLASH;
export const GEMINI_PRO_MODEL = MODEL_IDS.GEMINI_PRO;

export function modelForSource(source: AiDataSource): AiModelId {
  switch (source) {
    case "static":
      return MODEL_IDS.STATIC;
    case "cache":
      return MODEL_IDS.CACHE;
    case "openrouter_free":
      return MODEL_IDS.GPT_OSS_120B;
    case "gemini_flash":
      return MODEL_IDS.GEMINI_FLASH;
    case "gemini_pro":
      return MODEL_IDS.GEMINI_PRO;
  }
}

export function isPaidModel(model: AiModelId | null): boolean {
  return model === MODEL_IDS.GEMINI_FLASH || model === MODEL_IDS.GEMINI_PRO;
}

export function isOpenRouterModel(model: AiModelId): boolean {
  return (
    model === MODEL_IDS.GPT_OSS_120B ||
    model === MODEL_IDS.GPT_OSS_20B ||
    model === MODEL_IDS.OPENROUTER_FREE_ROUTER
  );
}
