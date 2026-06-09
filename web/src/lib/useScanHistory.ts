import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "./entitlements";
import {
  fetchUserScans,
  fetchCareerScan,
  formatScanDate,
  type ScanFormInput,
} from "./scanService";
import {
  fetchUserXrays,
  fetchXrayByScanId,
  isRadarSubscriber,
  shouldShowBuyXray,
  xrayStatusLabel,
} from "./accessService";
import type { CareerScanRecord, CareerXrayRecord, ScanHistoryItem } from "../types";

export function useScanHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [scans, xrays, radar] = await Promise.all([
        fetchUserScans(user.id),
        fetchUserXrays(user.id),
        isRadarSubscriber(user.id),
      ]);

      const xrayByScan = new Map(xrays.map((x) => [x.scanId, x]));

      setItems(
        scans.map((scan) => {
          const xray = xrayByScan.get(scan.id) ?? null;
          return {
            ...scan,
            xray,
            xrayStatusLabel: xrayStatusLabel(xray, radar),
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scan history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useCareerScan(scanId: string | undefined) {
  const { user } = useAuth();
  const [scan, setScan] = useState<CareerScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id || !scanId) {
      setScan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const row = await fetchCareerScan(user.id, scanId);
      setScan(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scan");
      setScan(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, scanId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { scan, loading, error, refresh };
}

export function useScanAccess(scanId: string | undefined) {
  const { user } = useAuth();
  const { entitlements } = useEntitlements();
  const [showBuyXray, setShowBuyXray] = useState(true);
  const [xray, setXray] = useState<CareerXrayRecord | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id || !scanId) {
      setShowBuyXray(true);
      setXray(null);
      return;
    }

    const [buy, row] = await Promise.all([
      shouldShowBuyXray(user.id, scanId),
      fetchXrayByScanId(user.id, scanId),
    ]);
    setShowBuyXray(buy);
    setXray(row);
  }, [user?.id, scanId]);

  useEffect(() => {
    void refresh();
  }, [refresh, entitlements.hasRadar]);

  return { showBuyXray, xray, isRadar: entitlements.hasRadar, refresh };
}

export { formatScanDate, type ScanFormInput };
