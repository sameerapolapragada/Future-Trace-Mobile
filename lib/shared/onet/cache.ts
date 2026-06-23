import type { OnetCache, OnetOccupation } from "./types";

const CACHE_PREFIX = "onet_occ:";

/** In-memory cache for tests and serverless. */
export class InMemoryOnetCache implements OnetCache {
  store = new Map<string, OnetOccupation>();

  async get(key: string): Promise<OnetOccupation | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, occupation: OnetOccupation): Promise<void> {
    this.store.set(key, occupation);
  }

  clear(): void {
    this.store.clear();
  }
}

export function onetCacheKey(role: string): string {
  return `${CACHE_PREFIX}${role.trim().toLowerCase().replace(/\s+/g, "_")}`;
}

/** Adapter for key-value stores (AsyncStorage, Supabase JSON column, etc.). */
export function createOnetCacheAdapter(
  getItem: (key: string) => Promise<string | null>,
  setItem: (key: string, value: string) => Promise<void>
): OnetCache {
  return {
    async get(key: string): Promise<OnetOccupation | null> {
      const raw = await getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as OnetOccupation;
      } catch {
        return null;
      }
    },
    async set(key: string, occupation: OnetOccupation): Promise<void> {
      await setItem(key, JSON.stringify(occupation));
    },
  };
}
