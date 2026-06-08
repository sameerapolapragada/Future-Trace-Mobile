import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/useAuth";
import {
  consumeFreeScan,
  DEFAULT_ENTITLEMENTS,
  fetchUserEntitlements,
  mergeEntitlements,
} from "./entitlementsService";
import type { Entitlements } from "../types";

type EntitlementsContextValue = {
  entitlements: Entitlements;
  loading: boolean;
  error: string | null;
  useScan: () => Promise<void>;
  markScanComplete: () => void;
  refresh: () => Promise<void>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
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

  const useScan = useCallback(async () => {
    const remaining = await consumeFreeScan();
    setEntitlements((current) => mergeEntitlements(current, { freeScansRemaining: remaining }));
  }, []);

  const markScanComplete = useCallback(() => {
    setEntitlements((current) => mergeEntitlements(current, { hasCompletedScan: true }));
  }, []);

  const value = useMemo(
    () => ({ entitlements, loading, error, useScan, markScanComplete, refresh }),
    [entitlements, loading, error, useScan, markScanComplete, refresh]
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): EntitlementsContextValue {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error("useEntitlements must be used within EntitlementsProvider");
  }
  return context;
}
