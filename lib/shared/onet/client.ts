import { onetCacheKey } from "./cache";
import { matchLocalOccupation } from "./matchOccupation";
import type { OnetClientConfig, OnetMatchResult, OnetOccupation } from "./types";

const ONET_SEARCH_URL = "https://services.onetcenter.org/ws/online/search";
const ONET_OCCUPATION_URL = "https://services.onetcenter.org/ws/online/occupations";

function hasApiCredentials(config: OnetClientConfig): boolean {
  return Boolean(config.username?.trim() && config.password?.trim());
}

function toBasicAuth(username: string, password: string): string {
  const value = `${username}:${password}`;
  if (typeof btoa !== "undefined") return btoa(value);
  return Buffer.from(value, "utf-8").toString("base64");
}

async function fetchOnetSearch(role: string, config: OnetClientConfig): Promise<string | null> {
  const auth = toBasicAuth(config.username!, config.password!);
  const url = `${ONET_SEARCH_URL}?keyword=${encodeURIComponent(role)}&start=1&end=5`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    occupation?: { code?: string }[];
  };

  const code = data.occupation?.[0]?.code;
  return code ?? null;
}

async function fetchOnetOccupation(code: string, config: OnetClientConfig): Promise<OnetOccupation | null> {
  const auth = toBasicAuth(config.username!, config.password!);
  const url = `${ONET_OCCUPATION_URL}/${code}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    code?: string;
    title?: string;
    description?: { description?: string };
    task?: { task?: string }[];
    skill?: { name?: string }[];
    work_activity?: { name?: string }[];
    alternate_title?: { title?: string }[];
  };

  if (!data.code || !data.title) return null;

  return {
    code: data.code,
    title: data.title,
    description: data.description?.description ?? "",
    tasks: (data.task ?? []).map((t) => t.task).filter(Boolean) as string[],
    skills: (data.skill ?? []).map((s) => s.name).filter(Boolean) as string[],
    workActivities: (data.work_activity ?? []).map((w) => w.name).filter(Boolean) as string[],
    alternateTitles: (data.alternate_title ?? []).map((a) => a.title).filter(Boolean) as string[],
  };
}

/**
 * Resolve a user-entered role to O*NET occupation data.
 * Order: cache → live API (if credentialed) → local index.
 */
export async function resolveOccupation(role: string, config: OnetClientConfig = {}): Promise<OnetMatchResult | null> {
  const trimmed = role.trim();
  if (!trimmed) return null;

  const cacheKey = onetCacheKey(trimmed);
  const cache = config.cache;

  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return { occupation: cached, matchScore: 1, matchedVia: "cache" };
    }
  }

  if (hasApiCredentials(config)) {
    try {
      const code = await fetchOnetSearch(trimmed, config);
      if (code) {
        const occupation = await fetchOnetOccupation(code, config);
        if (occupation) {
          await cache?.set(cacheKey, occupation);
          return { occupation, matchScore: 1, matchedVia: "api" };
        }
      }
    } catch {
      // Fall through to local index
    }
  }

  const local = matchLocalOccupation(trimmed);
  if (local) {
    await cache?.set(cacheKey, local.occupation);
  }
  return local;
}
