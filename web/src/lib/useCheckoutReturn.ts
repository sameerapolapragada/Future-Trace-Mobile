import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmCheckout } from "./checkoutService";

/** After Stripe redirect, confirm the session, refresh entitlements, and strip checkout query params. */
export function useCheckoutReturn(refresh: () => Promise<void>) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    const sessionId = params.get("session_id")?.trim() ?? "";
    let cancelled = false;

    async function handleReturn() {
      if (sessionId) {
        try {
          await confirmCheckout(sessionId);
        } catch {
          // Webhook may still unlock later; refresh below picks it up on retry.
        }
      }

      if (!cancelled) {
        await refresh();
      }
    }

    void handleReturn();

    const retryTimers = [2000, 5000, 10000].map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) void handleReturn();
      }, delay)
    );

    navigate(location.pathname, { replace: true });

    return () => {
      cancelled = true;
      retryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [location.pathname, navigate, refresh]);
}
