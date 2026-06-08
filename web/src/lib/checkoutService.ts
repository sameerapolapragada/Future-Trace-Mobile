import { apiJson, isApiConfigured } from "./apiClient";

export type CheckoutProduct = "xray" | "radar";

type CheckoutResponse = {
  url: string;
};

type CheckoutConfirmResponse = {
  hasCareerXRay: boolean;
  hasRadar: boolean;
};

export function isCheckoutConfigured(): boolean {
  return isApiConfigured();
}

/** Creates a Stripe Checkout session via Future-Trace BFF and returns the redirect URL. */
export async function startCheckout(product: CheckoutProduct): Promise<string> {
  const { url } = await apiJson<CheckoutResponse>("/api/v1/checkout", {
    method: "POST",
    body: {
      product,
      returnOrigin: window.location.origin,
    },
  });

  if (!url) {
    throw new Error("Checkout URL missing from server response");
  }

  return url;
}

/** Confirms a paid Stripe session and unlocks entitlements (works even if webhook is delayed). */
export async function confirmCheckout(sessionId: string): Promise<CheckoutConfirmResponse> {
  return apiJson<CheckoutConfirmResponse>("/api/v1/checkout/confirm", {
    method: "POST",
    body: { sessionId },
  });
}
