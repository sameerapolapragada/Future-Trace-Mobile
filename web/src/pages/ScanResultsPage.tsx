import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AiDisclaimer } from "../components/AiDisclaimer";
import { DisruptionRadarCard } from "../components/DisruptionRadarCard";
import { EarlyAccessWaitlistForm } from "../components/EarlyAccessWaitlistForm";
import { FutureFeatureBanner } from "../components/FutureFeatureBanner";
import { HelpTip } from "../components/HelpTip";
import { Badge, PrimaryButton, SecondaryButtonLink } from "../design-system";
import { formatRoleName } from "../components/XRayReportSections";
import { isCheckoutConfigured, startXrayCheckout } from "../lib/checkoutService";
import { createPendingXrayPurchase, generateCareerXray } from "../lib/xrayService";
import { useAuth } from "../auth/useAuth";
import { useCareerScan, useScanAccess } from "../lib/useScanHistory";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import { useEntitlements } from "../lib/entitlements";
import {
  isMvpAiCareerTransitionPurchaseEnabled,
  isMvpCareerXrayPurchaseEnabled,
} from "../lib/mvpFlags";
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
            <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted">
              Resilience Index
              <HelpTip
                title="Career Resilience Index"
                ariaLabel="What is the Career Resilience Index?"
                align="center"
              >
                A score from 0–100 estimating how well this role may hold up as work changes—based on
                your skills, typical tasks, and industry trends. It is advisory guidance, not a job
                guarantee.
              </HelpTip>
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
            <Badge tone="default">AI Exposure: {profile.aiExposureLabel}</Badge>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted">
              Automation risk
              <HelpTip
                title="AI Exposure"
                ariaLabel="What does AI Exposure mean?"
                align="center"
              >
                How much typical work in this role may be automated or displaced by AI—not how much
                the role uses AI tools. Low means fewer automatable tasks; high means more.
              </HelpTip>
            </p>
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
  const xrayPurchaseEnabled = isMvpCareerXrayPurchaseEnabled();
  const transitionPurchaseEnabled = isMvpAiCareerTransitionPurchaseEnabled();

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

      {result.summary ? (
        <section className="rounded-2xl border border-white/10 bg-navy-card/90 p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Summary</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{result.summary}</p>
        </section>
      ) : null}

      <DisruptionRadarCard result={result} />

      {result.initialRoleRecommendations && result.initialRoleRecommendations.length > 0 ? (
        <section className="rounded-2xl border border-accent/20 bg-navy-card/90 p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Initial Role Recommendations
          </h2>
          <ul className="mt-3 space-y-2">
            {result.initialRoleRecommendations.map((role) => (
              <li key={role} className="text-sm text-white/90">
                • {role}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.xrayPreview ? (
        <section className="rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/10 to-navy-card p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">
            Career X-Ray Preview
          </h2>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
            {result.xrayPreview.readinessScore}
            <span className="text-sm font-normal text-muted">/100 readiness</span>
          </p>
          <p className="mt-2 text-sm text-white/90">{result.xrayPreview.topRoleTeaser}</p>
          <p className="mt-3 text-xs text-muted">{result.xrayPreview.unlockMessage}</p>
        </section>
      ) : null}

      <div className="space-y-3 pt-2">
        {xray?.status === "generated" ? (
          <PrimaryButton fullWidth onClick={() => navigate(`/xray/${scanId}`)}>
            View Career X-Ray
          </PrimaryButton>
        ) : xray?.status === "paid" || isRadar ? (
          <PrimaryButton fullWidth disabled={actionLoading} onClick={() => void handleGenerateXray()}>
            {actionLoading ? "Generating…" : "Generate Career X-Ray"}
          </PrimaryButton>
        ) : showBuyXray && xrayPurchaseEnabled ? (
          <PrimaryButton fullWidth disabled={actionLoading} onClick={() => void handleUnlockXray()}>
            {actionLoading ? "Starting checkout…" : "Unlock Career X-Ray — $1.99"}
          </PrimaryButton>
        ) : null}

        {showBuyXray && !xrayPurchaseEnabled ? (
          <section className="rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/10 to-navy-card p-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">
              Career X-Ray — Coming Soon
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Deep skill-gap analysis and transition roles — join early access to be notified at launch.
            </p>
            <EarlyAccessWaitlistForm
              email={user?.email ?? ""}
              currentRole={result.currentRole}
              targetRole={result.targetRole}
              source="web_xray_early_access"
              className="mt-4 border-white/10 bg-navy-card/80"
            />
          </section>
        ) : null}

        {!isRadar && transitionPurchaseEnabled ? (
          <SecondaryButtonLink to="/upgrade?product=transition" fullWidth>
            Start AI Career Transition — $9.99/month
          </SecondaryButtonLink>
        ) : !isRadar && !transitionPurchaseEnabled ? (
          <FutureFeatureBanner
            email={user?.email ?? ""}
            currentRole={result.currentRole}
            targetRole={result.targetRole}
          />
        ) : showBuyXray && isRadar && xrayPurchaseEnabled ? (
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

      <AiDisclaimer className="pt-2 text-center" />
    </div>
  );
}
