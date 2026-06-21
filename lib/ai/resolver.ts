import { resolveModelRoute } from "./router";
import { modelForSource } from "./models";
import type { AiDataSource, AiOrchestrationRequest, AiOrchestrationResult } from "./types";

const SOURCE_PRIORITY: AiDataSource[] = [
  "static",
  "cache",
  "openrouter_free",
  "gemini_flash",
  "gemini_pro",
];

function sourceRank(source: AiDataSource): number {
  return SOURCE_PRIORITY.indexOf(source);
}

/**
 * Cost-optimized resolution chain:
 * STATIC → CACHE → OPENROUTER FREE → GEMINI FLASH → GEMINI PRO
 *
 * Never escalates above the tier allowed by resolveModelRoute.
 */
export function resolveOrchestration(request: AiOrchestrationRequest): AiOrchestrationResult {
  const route = resolveModelRoute(request.feature, request.context, {
    cacheKey: request.cacheKey,
  });

  if (!route.allowed) return route;
  if (route.reuseExisting) return route;

  const allowedSource = route.source as AiDataSource | "existing_record" | null;
  if (!allowedSource || allowedSource === "existing_record") return route;

  const maxRank = sourceRank(allowedSource);
  if (maxRank < 0) return route;

  if (request.hasStaticAnswer && sourceRank("static") <= maxRank) {
    return {
      ...route,
      source: "static",
      model: modelForSource("static"),
      reuseExisting: false,
    };
  }

  if (request.hasCacheHit && sourceRank("cache") <= maxRank) {
    return {
      ...route,
      source: "cache",
      model: modelForSource("cache"),
      cacheKey: request.cacheKey ?? route.cacheKey,
      reuseExisting: false,
    };
  }

  return route;
}

export { SOURCE_PRIORITY };
