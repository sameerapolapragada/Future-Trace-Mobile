import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEntitlements } from "./entitlements";

const UPGRADE_PATH = "/upgrade?product=transition";

export function RequireTransitionSubscriber() {
  const { entitlements, loading } = useEntitlements();
  const location = useLocation();
  const isCheckoutReturn = new URLSearchParams(location.search).get("checkout") === "success";

  if (loading || isCheckoutReturn) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!entitlements.hasRadar) {
    return <Navigate to={UPGRADE_PATH} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
