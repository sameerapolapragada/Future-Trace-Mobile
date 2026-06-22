import { resolveOccupation } from "./client";
import type { OnetCache, OnetMatchResult } from "./types";

/**
 * Pluggable occupation data source for Career Scan.
 * Phase 1 native iOS: bundled O*NET index + device cache.
 * Phase 2+: swap in a Supabase-backed provider without changing scoring/UI.
 */
export type OccupationDataProvider = {
  resolveOccupation(role: string): Promise<OnetMatchResult | null>;
};

export type BundledOccupationProviderOptions = {
  cache?: OnetCache;
};

/** On-device bundled O*NET mapping — no network calls. */
export function createBundledOccupationProvider(
  options: BundledOccupationProviderOptions = {}
): OccupationDataProvider {
  return {
    async resolveOccupation(role: string) {
      // No API credentials — uses local index only (see onet/client.ts).
      return resolveOccupation(role, { cache: options.cache });
    },
  };
}

/**
 * Placeholder for future Supabase-backed occupation catalog.
 * Implement when role data is synced server-side; scoring engine stays unchanged.
 */
export type SupabaseOccupationProviderOptions = {
  cache?: OnetCache;
  fetchByRole: (role: string) => Promise<OnetMatchResult | null>;
};

export function createSupabaseOccupationProvider(
  options: SupabaseOccupationProviderOptions
): OccupationDataProvider {
  return {
    async resolveOccupation(role: string) {
      const cacheKey = role.trim().toLowerCase();
      const cached = await options.cache?.get(cacheKey);
      if (cached) {
        return { occupation: cached, matchScore: 1, matchedVia: "cache" };
      }

      const match = await options.fetchByRole(role);
      if (match?.occupation) {
        await options.cache?.set(cacheKey, match.occupation);
      }
      return match;
    },
  };
}
