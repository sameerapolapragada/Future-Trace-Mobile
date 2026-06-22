import { LOCAL_ONET_INDEX } from "./localIndex";
import type { OnetOccupation, OnetMatchResult } from "./types";

const MIN_MATCH_SCORE = 0.35;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const stop = new Set(["and", "the", "or", "of", "a", "an", "in", "for", "to", "with"]);
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1 && !stop.has(t));
}

function overlapScore(queryTokens: string[], candidate: string): number {
  const candidateTokens = new Set(tokenize(candidate));
  if (queryTokens.length === 0 || candidateTokens.size === 0) return 0;

  let hits = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) hits += 1;
    else {
      for (const ct of candidateTokens) {
        if (ct.includes(token) || token.includes(ct)) {
          hits += 0.6;
          break;
        }
      }
    }
  }

  return hits / queryTokens.length;
}

function scoreOccupation(role: string, occupation: OnetOccupation): number {
  const queryTokens = tokenize(role);
  const titleScore = overlapScore(queryTokens, occupation.title);
  const altScores = occupation.alternateTitles.map((alt) => overlapScore(queryTokens, alt));
  const bestAlt = altScores.length ? Math.max(...altScores) : 0;
  const descScore = overlapScore(queryTokens, occupation.description) * 0.35;

  return Math.min(1, Math.max(titleScore, bestAlt * 0.95, descScore));
}

/** Find the closest O*NET occupation from the local index. */
export function matchLocalOccupation(role: string): OnetMatchResult | null {
  const trimmed = role.trim();
  if (!trimmed) return null;

  let best: { occupation: OnetOccupation; score: number } | null = null;

  for (const occupation of LOCAL_ONET_INDEX) {
    const score = scoreOccupation(trimmed, occupation);
    if (!best || score > best.score) {
      best = { occupation, score };
    }
  }

  if (!best || best.score < MIN_MATCH_SCORE) return null;

  return {
    occupation: best.occupation,
    matchScore: best.score,
    matchedVia: "local_index",
  };
}

export { MIN_MATCH_SCORE };
