/** Deterministic cache keys for content_cache and scan dedupe. */

export function scanInputCacheKey(userId: string, inputHash: string): string {
  return `scan:${userId}:${inputHash}`;
}

export function xrayReportCacheKey(userId: string, scanId: string): string {
  return `xray:${userId}:${scanId}`;
}

export function roleIntelligenceCacheKey(roleSlug: string, marketSnapshotId?: string): string {
  return marketSnapshotId
    ? `role-intel:${roleSlug}:${marketSnapshotId}`
    : `role-intel:${roleSlug}`;
}

export function transitionRoadmapCacheKey(userId: string, goalId: string): string {
  return `roadmap:${userId}:${goalId}`;
}

export function premiumRoadmapRefreshCacheKey(userId: string, goalId: string): string {
  return `roadmap-premium:${userId}:${goalId}`;
}

export function marketRadarCacheKey(userId: string, goalId: string, period: string): string {
  return `market-radar:${userId}:${goalId}:${period}`;
}

export function transitionChatCacheKey(userId: string, conversationId: string, messageHash: string): string {
  return `chat:${userId}:${conversationId}:${messageHash}`;
}
