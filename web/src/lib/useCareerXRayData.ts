import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type { CareerOpportunitiesReport, XRayCompleteReport, XRayInsight } from "../types";
import { loadCareerXRayData } from "./xrayDataService";

type CareerXRayDataState = {
  report: XRayCompleteReport | null;
  insights: XRayInsight | null;
  opportunities: CareerOpportunitiesReport | null;
  loading: boolean;
  error: string | null;
  source: "database" | "session" | "mock" | null;
};

export function useCareerXRayData(enabled = true) {
  const { userId } = useAuth();
  const [state, setState] = useState<CareerXRayDataState>({
    report: null,
    insights: null,
    opportunities: null,
    loading: enabled,
    error: null,
    source: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({
        report: null,
        insights: null,
        opportunities: null,
        loading: false,
        error: null,
        source: null,
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await loadCareerXRayData(userId);
      setState({
        report: data.report,
        insights: data.insights,
        opportunities: data.opportunities,
        loading: false,
        error: null,
        source: data.source,
      });
    } catch (err) {
      setState({
        report: null,
        insights: null,
        opportunities: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load Career X-Ray data",
        source: null,
      });
    }
  }, [enabled, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
