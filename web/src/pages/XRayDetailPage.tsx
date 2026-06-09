import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { formatRoleName, XRayReportSections } from "../components/XRayReportSections";
import { useAuth } from "../auth/useAuth";
import { generateCareerXray } from "../lib/xrayService";
import { useCareerScan, useScanAccess } from "../lib/useScanHistory";

export default function XRayDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scan, loading, error } = useCareerScan(scanId);
  const { xray, isRadar, showBuyXray } = useScanAccess(scanId);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleGenerate() {
    if (!user?.id || !scanId) return;
    setActionLoading(true);
    try {
      await generateCareerXray(user.id, scanId);
      window.location.reload();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error || !scan) {
    return <p className="text-center text-sm text-red-400">{error ?? "Scan not found."}</p>;
  }

  if (xray?.status === "generated" && xray.result?.report) {
    return (
      <div className="space-y-4 pb-4">
        <button
          type="button"
          onClick={() => navigate("/xray-history")}
          className="text-xs font-medium text-accent"
        >
          ← Career X-Ray History
        </button>
        <XRayReportSections report={xray.result.report} scanId={scanId!} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 text-center">
      <h1 className="text-lg font-bold text-white">Career X-Ray</h1>
      <p className="text-sm text-muted">
        {formatRoleName(scan.currentRole)} → {formatRoleName(scan.targetRole)}
      </p>
      {isRadar || !showBuyXray ? (
        <PrimaryButton fullWidth disabled={actionLoading} onClick={() => void handleGenerate()}>
          {actionLoading ? "Generating…" : "Generate Career X-Ray"}
        </PrimaryButton>
      ) : (
        <Link to={`/results/${scanId}`} className="inline-block text-sm text-accent">
          Unlock Career X-Ray — $1.99
        </Link>
      )}
    </div>
  );
}
