import { Navigate } from "react-router-dom";
import { useEntitlements } from "./entitlements";

export function RequireCareerXRay({ children }: { children: React.ReactNode }) {
  const { entitlements, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!entitlements.hasCareerXRay) {
    return <Navigate to="/career-xray" replace />;
  }

  return children;
}
