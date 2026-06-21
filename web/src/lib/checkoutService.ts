import { apiJson, isApiConfigured } from "./apiClient";
import {
  EXTRA_XRAY_PRODUCT_KEY,
  TRANSITION_PRODUCT_KEY,
} from "./subscriptionUsageService";
import { isMvpCheckoutEnabled } from "./mvpFlags";

export type CheckoutProduct = "transition" | "career_xray_extra" | "career_xray_one_time";

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
  if (!isMvpCheckoutEnabled()) {
    throw new Error("Purchases are coming soon. Career Scan remains free.");
  }

  const productKey =
    product === "transition"
      ? TRANSITION_PRODUCT_KEY
      : EXTRA_XRAY_PRODUCT_KEY;

  const body: Record<string, string> = {
    product,
    productKey,
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
  return startCheckout("career_xray_extra", { scanId, xrayId });
}

/** @deprecated Use startTransitionCheckout */
export async function startRadarCheckout(): Promise<string> {
  return startTransitionCheckout();
}

export async function startTransitionCheckout(): Promise<string> {
  return startCheckout("transition");
}

export async function confirmCheckout(sessionId: string): Promise<CheckoutConfirmResponse> {
  return apiJson<CheckoutConfirmResponse>("/api/v1/checkout/confirm", {
    method: "POST",
    body: { sessionId },
  });
}
