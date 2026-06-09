import { Link, useNavigate, useParams } from "react-router-dom";
import { CareerOpportunitiesView, formatXrayIdLabel } from "../components/CareerOpportunitiesView";
import { useCareerScan, useScanAccess } from "../lib/useScanHistory";

export default function TransitionPathsPage() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const { loading, error } = useCareerScan(scanId);
  const { xray } = useScanAccess(scanId);

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error || !scanId || xray?.status !== "generated" || !xray.result?.opportunities) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">Transition roles are not available for this scan yet.</p>
        <Link to="/xray-history" className="mt-3 inline-block text-sm text-accent">
          Back to Career X-Ray History
        </Link>
      </div>
    );
  }

  return (
    <CareerOpportunitiesView
      roles={xray.result.opportunities.recommendedRoles}
      xrayIdLabel={formatXrayIdLabel(xray.id)}
      onBack={() => navigate(`/xray/${scanId}`)}
    />
  );
}
