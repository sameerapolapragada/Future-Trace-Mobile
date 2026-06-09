import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmCheckout } from "../lib/checkoutService";
import { useEntitlements } from "../lib/entitlements";

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useEntitlements();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id")?.trim() ?? "";
    let cancelled = false;

    async function complete() {
      if (sessionId) {
        try {
          await confirmCheckout(sessionId);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Could not confirm payment");
          }
        }
      }

      if (cancelled) return;

      await refresh();

      if (!cancelled) {
        navigate("/transition", { replace: true });
      }
    }

    void complete();

    const retries = [2000, 5000].map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) void complete();
      }, delay)
    );

    return () => {
      cancelled = true;
      retries.forEach((timer) => window.clearTimeout(timer));
    };
  }, [navigate, refresh, searchParams]);

  return (
    <div className="flex min-h-[50svh] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p className="text-sm text-white">Unlocking AI Career Transition…</p>
      {error ? (
        <p className="text-xs text-muted">
          {error} Retrying — if this persists, contact support with your payment receipt.
        </p>
      ) : null}
    </div>
  );
}
