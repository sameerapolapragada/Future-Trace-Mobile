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
import { DEFAULT_ENTITLEMENTS, fetchUserEntitlements } from "./entitlementsService";
import type { Entitlements } from "../types";

type EntitlementsContextValue = {
  entitlements: Entitlements;
  loading: boolean;
  error: string | null;
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

  const value = useMemo(
    () => ({ entitlements, loading, error, refresh }),
    [entitlements, loading, error, refresh]
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
