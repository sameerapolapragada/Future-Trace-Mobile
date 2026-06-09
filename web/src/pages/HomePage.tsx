import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Card, LogoMark, PrimaryButtonLink, SectionHeader } from "../design-system";
import { useEntitlements } from "../lib/entitlements";
import { getCareerXRayPath, getNewScanPath } from "../lib/entitlementsService";
import type { SavedScanSummary } from "../lib/profileService";
import { useProfileData } from "../lib/useProfileData";
import { getFirstName } from "../lib/userDisplay";
import { cn } from "../lib/cn";

function ScanCornersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 18 8" strokeLinecap="round" />
    </svg>
  );
}

function HomeWelcomeHeader({ firstName, hasScans }: { firstName: string; hasScans: boolean }) {
  return (
    <header className="flex items-center gap-3">
      <LogoMark size={44} className="shrink-0" />
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-muted">
          {hasScans
            ? "Your AI Career Intelligence Dashboard"
            : "Start your first Career Scan to see your resilience profile"}
        </p>
      </div>
    </header>
  );
}

function formatExposureLabel(level: string | null): string {
  if (!level) return "—";
  const normalized = level.toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "high") return "High";
  return "Medium";
}

function PastScansSection({ scans }: { scans: SavedScanSummary[] }) {
  const [expanded, setExpanded] = useState(false);

  if (scans.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mb-3 flex items-end justify-between gap-3">
        <SectionHeader
          className="mb-0"
          title="Past Scans"
          subtitle={`${scans.length} free ${scans.length === 1 ? "scan" : "scans"}`}
        />
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse past scans" : "Expand past scans"}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:bg-white/[0.04] hover:text-white ft-focus-ring"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn("transition", expanded && "rotate-180")}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {expanded ? (
        <Card padding="md" className="border border-white/8 bg-navy-card shadow-none">
          <div className="space-y-2">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                to={`/results/${scan.id}`}
                className="block rounded-xl border border-white/6 bg-white/[0.02] px-3 py-3 transition hover:bg-white/[0.04] active:scale-[0.99] ft-focus-ring"
              >
                <p className="text-xs text-muted">Target Role</p>
                <p className="text-sm font-semibold text-white">{scan.targetRole}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted">Resilience Index</p>
                    <p className="text-sm font-bold tabular-nums text-white">
                      {scan.resilienceScore != null ? (
                        <>
                          {scan.resilienceScore}
                          <span className="text-xs font-normal text-muted">/100</span>
                        </>
                      ) : (
                        "Pending"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">AI Exposure</p>
                    <p className="text-sm font-bold text-white">
                      {formatExposureLabel(scan.aiExposureLevel)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { entitlements, loading: entitlementsLoading } = useEntitlements();
  const { scans, loading: scansLoading } = useProfileData();
  const firstName = getFirstName(user);
  const scanTo = getNewScanPath(entitlements);
  const xrayTo = getCareerXRayPath(entitlements);
  const radarTo = entitlements.hasRadar ? "/radar" : "/upgrade";

  if (entitlementsLoading || scansLoading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="ft-display-page flex min-h-full flex-1 flex-col pb-4">
      <HomeWelcomeHeader firstName={firstName} hasScans={scans.length > 0} />

      <div className="flex flex-1 flex-col items-center justify-center pt-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="w-full space-y-3">
            <PrimaryButtonLink to={scanTo} fullWidth className="flex items-center justify-center gap-2">
              <ScanCornersIcon />
              Start New Scan
            </PrimaryButtonLink>

            <div className="grid grid-cols-2 gap-3">
              <PrimaryButtonLink to={xrayTo} fullWidth>
                Career X-Ray
              </PrimaryButtonLink>
              <PrimaryButtonLink to={radarTo} fullWidth className="flex items-center justify-center gap-2">
                <RadarIcon />
                View Radar
              </PrimaryButtonLink>
            </div>
          </div>

          <PastScansSection scans={scans} />
        </div>
      </div>
    </div>
  );
}
