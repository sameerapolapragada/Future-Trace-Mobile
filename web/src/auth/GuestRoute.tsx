import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[50svh] flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
    </div>
  );
}

/** For /login — send fully authenticated users to the app home. */
export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
