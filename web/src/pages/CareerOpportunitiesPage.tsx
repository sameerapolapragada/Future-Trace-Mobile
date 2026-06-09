import { useNavigate } from "react-router-dom";
import { CareerOpportunitiesView } from "../components/CareerOpportunitiesView";
import { RequireCareerXRay } from "../lib/RequireCareerXRay";
import { useCareerXRayData } from "../lib/useCareerXRayData";

export default function CareerOpportunitiesPage() {
  const navigate = useNavigate();
  const { report, opportunities, loading, error } = useCareerXRayData();
  const xrayId = report?.xrayId ?? "XR-00000";

  return (
    <RequireCareerXRay>
      {loading || !opportunities ? (
        <div className="flex min-h-[40svh] flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-400">{error}</p>
      ) : (
        <CareerOpportunitiesView
          roles={opportunities.recommendedRoles}
          xrayIdLabel={xrayId}
          onBack={() => navigate("/xray")}
        />
      )}
    </RequireCareerXRay>
  );
}
