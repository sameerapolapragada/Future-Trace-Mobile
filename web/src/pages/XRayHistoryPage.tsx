import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, PrimaryButton, PrimaryButtonLink, SectionHeader } from "../design-system";
import { EarlyAccessWaitlistForm } from "../components/EarlyAccessWaitlistForm";
import { formatRoleName } from "../components/XRayReportSections";
import { XRayReportSections } from "../components/XRayReportSections";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { isCheckoutConfigured, startXrayCheckout } from "../lib/checkoutService";
import { createPendingXrayPurchase, generateCareerXray, getXraySummaryMetrics } from "../lib/xrayService";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import { useScanHistory } from "../lib/useScanHistory";
import { formatScanDate } from "../lib/scanService";
import { isMvpCareerXrayPurchaseEnabled } from "../lib/mvpFlags";
import { cn } from "../lib/cn";
import type { ScanHistoryItem } from "../types";

function ScanHistoryCard({ item, isRadar }: { item: ScanHistoryItem; isRadar: boolean; onRefresh: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const xrayPurchaseEnabled = isMvpCareerXrayPurchaseEnabled();

  const generated = item.xray?.status === "generated" && item.xray.result;
  const metrics = getXraySummaryMetrics(item.xray?.result ?? null);

  async function handleUnlock() {
    if (!user?.id || !isCheckoutConfigured()) return;
    setLoading(true);
    try {
      const pending = await createPendingXrayPurchase(user.id, item.id);
      const url = await startXrayCheckout(item.id, pending.id);
      window.location.assign(url);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const generated = await generateCareerXray(user.id, item.id);
      navigate(`/xray-complete/${generated.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-card/90">
      <button
        type="button"
        onClick={() => generated && setExpanded((p) => !p)}
        className={cn("w-full px-4 py-4 text-left", generated && "ft-focus-ring")}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-white">
              {formatRoleName(item.currentRole)} → {formatRoleName(item.targetRole)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {generated
                ? `Generated ${formatScanDate(item.xray!.generatedAt!)}`
                : `Scan ${formatScanDate(item.createdAt)}`}
            </p>
          </div>
          <Badge tone={generated ? "success" : "default"}>{item.xrayStatusLabel}</Badge>
        </div>

        {generated ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Metric label="Readiness" value={metrics.readiness} className="text-accent" />
            <Metric label="Difficulty" value={metrics.difficulty} className="text-danger" />
            <Metric label="Time" value={metrics.transitionTime} className="text-accent" />
            <Metric label="Salary Upside" value={metrics.salaryUpside} className="text-success" />
          </div>
        ) : null}

        {generated && !expanded ? (
          <p className="mt-3 text-xs font-medium text-accent">View Details</p>
        ) : null}
      </button>

      {!generated ? (
        <div className="border-t border-white/8 px-4 py-3 space-y-2">
          <Link to={`/results/${item.id}`} className="block text-xs text-accent">
            View Free Scan
          </Link>
          {isRadar ? (
            <PrimaryButton fullWidth disabled={loading} onClick={() => void handleGenerate()}>
              {loading ? "Generating…" : "Generate Career X-Ray"}
            </PrimaryButton>
          ) : xrayPurchaseEnabled ? (
            <PrimaryButton fullWidth disabled={loading} onClick={() => void handleUnlock()}>
              {loading ? "Starting checkout…" : "Unlock Career X-Ray — $1.99"}
            </PrimaryButton>
          ) : (
            <EarlyAccessWaitlistForm
              email={user?.email ?? ""}
              currentRole={item.currentRole}
              targetRole={item.targetRole}
              source="web_xray_early_access"
              className="border-white/10 bg-navy-card/80"
            />
          )}
        </div>
      ) : null}

      {expanded && generated && item.xray?.result?.report ? (
        <div className="border-t border-white/8 px-4 py-4">
          <XRayReportSections report={item.xray.result.report} scanId={item.id} />
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-0.5 font-semibold", className)}>{value}</p>
    </div>
  );
}

export default function XRayHistoryPage() {
  const { entitlements, refresh: refreshEntitlements } = useEntitlements();
  const { items, loading, error, refresh } = useScanHistory();

  useCheckoutReturn(async () => {
    await refreshEntitlements();
    await refresh();
  });

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-white">Career X-Ray History</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Each X-Ray is tied to a specific scan so you can compare how your goals change over time.
        </p>
      </header>

      <PrimaryButtonLink to="/scan" fullWidth>
        Run New Career Scan
      </PrimaryButtonLink>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-navy-card/60 px-4 py-8 text-center">
          <p className="text-sm text-muted">No scans yet. Run a free scan to get started.</p>
        </div>
      ) : (
        <section>
          <SectionHeader title="Your Scans" className="mb-3" />
          <div className="space-y-3">
            {items.map((item) => (
              <ScanHistoryCard
                key={item.id}
                item={item}
                isRadar={entitlements.hasRadar}
                onRefresh={refresh}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
