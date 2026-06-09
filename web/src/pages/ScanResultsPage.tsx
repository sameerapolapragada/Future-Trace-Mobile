import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, PrimaryButton, SecondaryButtonLink } from "../design-system";
import { formatRoleName } from "../components/XRayReportSections";
import { isCheckoutConfigured, startXrayCheckout } from "../lib/checkoutService";
import { createPendingXrayPurchase, generateCareerXray } from "../lib/xrayService";
import { useAuth } from "../auth/useAuth";
import { useCareerScan, useScanAccess } from "../lib/useScanHistory";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";
import type { RoleScanProfile } from "../types";

function InsightSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "strength" | "vulnerability" | "opportunity";
}) {
  const border = {
    strength: "border-success/20",
    vulnerability: "border-danger/20",
    opportunity: "border-accent/20",
  };
  const heading = {
    strength: "text-success",
    vulnerability: "text-danger",
    opportunity: "text-accent",
  };

  return (
    <section className={cn("rounded-2xl border bg-navy-card/90 p-4", border[tone])}>
      <h2 className={cn("mb-3 text-[10px] font-bold uppercase tracking-widest", heading[tone])}>
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-white/90">
            • {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoleScanResults({
  roleLabel,
  roleName,
  profile,
  tone,
}: {
  roleLabel: string;
  roleName: string;
  profile: RoleScanProfile;
  tone: "current" | "target";
}) {
  const accent = tone === "current" ? "text-accent" : "text-success";
  const border = tone === "current" ? "border-accent/25" : "border-success/25";

  return (
    <section className="space-y-4">
      <div className={cn("rounded-2xl border bg-navy-card p-4", border)}>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", accent)}>{roleLabel}</p>
        <p className="mt-1 text-sm font-bold text-white">{formatRoleName(roleName)}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
            <p className="text-3xl font-bold tabular-nums text-white">
              {profile.resilienceScore}
              <span className="text-sm font-normal text-muted">/100</span>
            </p>
            <p className="mt-1 text-[10px] text-muted">Resilience Index</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
            <Badge tone="default">AI Exposure: {profile.aiExposureLabel}</Badge>
            <p className="mt-2 text-[10px] text-muted">Automation risk level</p>
          </div>
        </div>
      </div>

      <InsightSection title="Strengths" items={profile.strengths} tone="strength" />
      <InsightSection title="Vulnerabilities" items={profile.vulnerabilities} tone="vulnerability" />
      <InsightSection title="Opportunity Zones" items={profile.opportunityZones} tone="opportunity" />
    </section>
  );
}

export default function ScanResultsPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshEntitlements } = useEntitlements();
  const { scan, loading, error, refresh } = useCareerScan(scanId);
  const { showBuyXray, xray, isRadar, refresh: refreshScanAccess } = useScanAccess(scanId);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useCheckoutReturn(async () => {
    await refreshEntitlements();
    await Promise.all([refresh(), refreshScanAccess()]);
  });

  const result = scan?.freeResult;

  async function handleUnlockXray() {
    if (!user?.id || !scanId) return;
    if (!isCheckoutConfigured()) {
      setActionError("Checkout is not configured.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const pending = await createPendingXrayPurchase(user.id, scanId);
      const url = await startXrayCheckout(scanId, pending.id);
      window.location.assign(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Checkout failed");
      setActionLoading(false);
    }
  }

  async function handleGenerateXray() {
    if (!user?.id || !scanId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const xray = await generateCareerXray(user.id, scanId);
      navigate(`/xray-complete/${xray.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Generation failed");
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

  if (error || !scan || !result) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted">{error ?? "Scan not found."}</p>
        <Link to="/scan" className="mt-4 inline-block text-sm text-accent">
          Run a new scan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="text-center">
        <h1 className="text-lg font-semibold text-white">Free Scan Result</h1>
        <p className="mt-2 text-xs text-muted">
          {formatRoleName(result.currentRole)} → {formatRoleName(result.targetRole)}
        </p>
      </header>

      <RoleScanResults
        roleLabel="Current Role"
        roleName={result.currentRole}
        profile={result.currentRoleProfile}
        tone="current"
      />

      <RoleScanResults
        roleLabel="Target Role"
        roleName={result.targetRole}
        profile={result.targetRoleProfile}
        tone="target"
      />

      <div className="space-y-3 pt-2">
        {xray?.status === "generated" ? (
          <PrimaryButton fullWidth onClick={() => navigate(`/xray/${scanId}`)}>
            View Career X-Ray
          </PrimaryButton>
        ) : xray?.status === "paid" || isRadar ? (
          <PrimaryButton fullWidth disabled={actionLoading} onClick={() => void handleGenerateXray()}>
            {actionLoading ? "Generating…" : "Generate Career X-Ray"}
          </PrimaryButton>
        ) : showBuyXray ? (
          <PrimaryButton fullWidth disabled={actionLoading} onClick={() => void handleUnlockXray()}>
            {actionLoading ? "Starting checkout…" : "Unlock Career X-Ray — $1.99"}
          </PrimaryButton>
        ) : null}

        {!isRadar ? (
          <SecondaryButtonLink to="/upgrade?product=transition" fullWidth>
            Start AI Career Transition — $9.99/month
          </SecondaryButtonLink>
        ) : showBuyXray && isRadar ? (
          <SecondaryButtonLink to="/upgrade?product=transition&reason=monthly-xrays" fullWidth>
            Buy Extra X-Ray — $1.99
          </SecondaryButtonLink>
        ) : null}
      </div>

      {actionError ? (
        <p className="text-center text-xs text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
