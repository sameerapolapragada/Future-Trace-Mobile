import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEntitlements } from "../lib/entitlements";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import { useAuth } from "./useAuth";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[50svh] flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const { refresh } = useEntitlements();
  const location = useLocation();

  // Legacy Stripe success URLs (e.g. /home?checkout=success) still confirm + unlock.
  useCheckoutReturn(refresh, { radarRedirectTo: "/transition" });

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
