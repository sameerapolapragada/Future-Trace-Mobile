import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { formatRoleName } from "../components/XRayReportSections";
import { roleTitleToSlug } from "../lib/xrayDataService";
import { useCareerScan, useScanAccess } from "../lib/useScanHistory";
import type { CareerOpportunityRole } from "../types";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-accent">
      ← Back
    </button>
  );
}

function OpportunityCard({ role }: { role: CareerOpportunityRole }) {
  const rolePath = `/xray/role/${roleTitleToSlug(role.title)}`;
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-card/90 p-4">
      <p className="text-sm font-bold text-white">{role.title}</p>
      <p className="mt-1 text-xs text-accent">{role.matchScore}% match</p>
      <Link to={rolePath} className="mt-2 block text-[10px] text-muted">
        {role.whyFits}
      </Link>
    </div>
  );
}

export default function TransitionPathsPage() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const { scan, loading, error } = useCareerScan(scanId);
  const { xray } = useScanAccess(scanId);

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error || !scan || xray?.status !== "generated" || !xray.result?.opportunities) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">Transition paths are not available for this scan yet.</p>
        <Link to="/xray-history" className="mt-3 inline-block text-sm text-accent">
          Back to Career X-Ray History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <BackButton onClick={() => navigate(`/xray/${scanId}`)} />
      <div>
        <h1 className="text-sm font-bold uppercase tracking-widest text-white">Explore Transition Paths</h1>
        <p className="mt-1 text-xs text-muted">
          {formatRoleName(scan.currentRole)} → {formatRoleName(scan.targetRole)}
        </p>
      </div>
      <div className="space-y-3">
        {xray.result.opportunities.recommendedRoles.map((role) => (
          <OpportunityCard key={role.title} role={role} />
        ))}
      </div>
    </div>
  );
}
