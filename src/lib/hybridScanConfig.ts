import Constants from "expo-constants";
import type { HybridScanConfig } from "../../lib/shared";
import { createBundledOccupationProvider } from "../../lib/shared/onet/provider";
import { onetDeviceCache } from "./onetCache";

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return extra?.[key] ?? process.env[key];
}

/**
 * Phase 1 native iOS MVP scan config:
 * - Bundled O*NET role mapping (no live O*NET API)
 * - On-device scoring engine
 * - Template explanations (no network / BFF / OpenRouter)
 * - No Supabase for scans
 */
export function getHybridScanConfig(): HybridScanConfig {
  return {
    occupationProvider: createBundledOccupationProvider({ cache: onetDeviceCache }),
    explanation: {
      // Optional: set EXPO_PUBLIC_OPENROUTER_API_KEY in .env for richer explanations.
      // Phase 1 default is template-only (fully on-device).
      apiKey: readExtra("openrouterApiKey") ?? readExtra("EXPO_PUBLIC_OPENROUTER_API_KEY"),
      siteUrl: readExtra("EXPO_PUBLIC_OPENROUTER_SITE_URL") ?? "https://futuretrace.ai",
      appName: "Future Trace",
    },
  };
}
