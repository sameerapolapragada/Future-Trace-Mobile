import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  DEFAULT_ENTITLEMENTS,
  fetchUserEntitlements,
  mergeEntitlements,
} from "./entitlementsService";
import type { Entitlements } from "../types";

export function useEntitlements() {
  const { userId, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(DEFAULT_ENTITLEMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchUserEntitlements(userId);
      setEntitlements(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entitlements");
      setEntitlements(DEFAULT_ENTITLEMENTS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      setLoading(false);
      setError(null);
      return;
    }

    void refresh();
  }, [isAuthenticated, refresh]);

  /** Dev mock until Stripe checkout writes purchases (Week 3). */
  const unlock = useCallback((product: "xray" | "radar") => {
    setEntitlements((current) =>
      mergeEntitlements(current, {
        hasCareerXRay: product === "xray" || product === "radar" ? true : current.hasCareerXRay,
        hasRadar: product === "radar" ? true : current.hasRadar,
      })
    );
  }, []);

  /** Optimistic until POST /api/v1/scans consumes quota (Week 2). */
  const useScan = useCallback(() => {
    setEntitlements((current) =>
      mergeEntitlements(current, {
        freeScansRemaining: Math.max(0, current.freeScansRemaining - 1),
      })
    );
  }, []);

  const markScanComplete = useCallback(() => {
    setEntitlements((current) => mergeEntitlements(current, { hasCompletedScan: true }));
  }, []);

  return { entitlements, loading, error, unlock, useScan, markScanComplete, refresh };
}
