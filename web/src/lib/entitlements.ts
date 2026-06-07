import { useCallback, useState } from "react";
import type { Entitlements } from "../types";

const STORAGE_KEY = "ft-entitlements";

const DEFAULT: Entitlements = {
  freeScansRemaining: 1,
  hasCareerXRay: false,
  hasRadar: false,
};

export function getEntitlements(): Entitlements {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveEntitlements(entitlements: Entitlements) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entitlements));
}

export function unlockProduct(product: "xray" | "radar"): Entitlements {
  const current = getEntitlements();
  const next = {
    ...current,
    hasCareerXRay: product === "xray" || product === "radar" ? true : current.hasCareerXRay,
    hasRadar: product === "radar" ? true : current.hasRadar,
  };
  saveEntitlements(next);
  return next;
}

export function consumeFreeScan(): Entitlements {
  const current = getEntitlements();
  const next = {
    ...current,
    freeScansRemaining: Math.max(0, current.freeScansRemaining - 1),
  };
  saveEntitlements(next);
  return next;
}

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState(getEntitlements);

  const refresh = useCallback(() => setEntitlements(getEntitlements()), []);

  const unlock = useCallback(
    (product: "xray" | "radar") => {
      setEntitlements(unlockProduct(product));
    },
    []
  );

  const useScan = useCallback(() => {
    setEntitlements(consumeFreeScan());
  }, []);

  return { entitlements, unlock, useScan, refresh };
}
