import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmCheckout } from "./checkoutService";

type CheckoutReturnOptions = {
  /** After a successful Radar / Transition checkout, navigate here. */
  radarRedirectTo?: string;
};

/** After Stripe redirect, confirm the session, refresh entitlements, and strip checkout query params. */
export function useCheckoutReturn(
  refresh: () => Promise<void>,
  options: CheckoutReturnOptions = {}
) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    const sessionId = params.get("session_id")?.trim() ?? "";
    let cancelled = false;

    async function handleReturn() {
      let radarUnlocked = false;

      if (sessionId) {
        try {
          const result = await confirmCheckout(sessionId);
          radarUnlocked = result.hasRadar === true;
        } catch {
          // Webhook or retry may still unlock later.
        }
      }

      if (cancelled) return;

      await refresh();

      if (cancelled) return;

      if (radarUnlocked && options.radarRedirectTo) {
        navigate(options.radarRedirectTo, { replace: true });
      } else {
        navigate(location.pathname, { replace: true });
      }
    }

    void handleReturn();

    const retryTimers = [2000, 5000, 10000].map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) void handleReturn();
      }, delay)
    );

    return () => {
      cancelled = true;
      retryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [location.pathname, navigate, options.radarRedirectTo, refresh]);
}
