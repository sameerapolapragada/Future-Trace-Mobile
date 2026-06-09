import { apiJson, isApiConfigured } from "./apiClient";

export type CheckoutProduct = "radar" | "career_xray_one_time";

type CheckoutResponse = {
  url: string;
};

type CheckoutConfirmResponse = {
  hasRadar: boolean;
  scanId?: string;
  xrayId?: string;
};

export function isCheckoutConfigured(): boolean {
  return isApiConfigured();
}

export async function startCheckout(
  product: CheckoutProduct,
  options?: { scanId?: string; xrayId?: string }
): Promise<string> {
  const body: Record<string, string> = {
    product,
    productKey: product,
    returnOrigin: window.location.origin,
  };

  if (options?.scanId) body.scanId = options.scanId;
  if (options?.xrayId) body.xrayId = options.xrayId;

  const { url } = await apiJson<CheckoutResponse>("/api/v1/checkout", {
    method: "POST",
    body,
  });

  if (!url) throw new Error("Checkout URL missing from server response");
  return url;
}

export async function startXrayCheckout(scanId: string, xrayId: string): Promise<string> {
  return startCheckout("career_xray_one_time", { scanId, xrayId });
}

export async function startRadarCheckout(): Promise<string> {
  const { url } = await apiJson<CheckoutResponse>("/api/v1/checkout", {
    method: "POST",
    body: {
      product: "radar",
      productKey: "ai_career_radar_monthly",
      returnOrigin: window.location.origin,
    },
  });
  if (!url) throw new Error("Checkout URL missing from server response");
  return url;
}

export async function confirmCheckout(sessionId: string): Promise<CheckoutConfirmResponse> {
  return apiJson<CheckoutConfirmResponse>("/api/v1/checkout/confirm", {
    method: "POST",
    body: { sessionId },
  });
}
