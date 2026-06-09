import { Navigate } from "react-router-dom";

/** @deprecated Use snapshot-based access. Redirects to Career X-Ray hub. */
export function RequireCareerXRay({ children }: { children: React.ReactNode }) {
  return children;
}

export function RequireCareerXRayLegacy() {
  return <Navigate to="/xray" replace />;
}
