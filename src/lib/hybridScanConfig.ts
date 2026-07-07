import type { HybridScanConfig } from "../../lib/shared";
import { createBundledOccupationProvider } from "../../lib/shared/onet/provider";
import { onetDeviceCache } from "./onetCache";

/**
 * Phase 1 native iOS MVP scan config:
 * - Bundled O*NET role mapping (no live O*NET API)
 * - On-device scoring engine
 * - Template explanations only (no OpenRouter / no API keys in app bundle)
 * - No Supabase for scans
 */
export function getHybridScanConfig(): HybridScanConfig {
  return {
    occupationProvider: createBundledOccupationProvider({ cache: onetDeviceCache }),
    explanation: {},
  };
}
