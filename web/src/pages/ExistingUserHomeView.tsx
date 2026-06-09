import { Link } from "react-router-dom";
import { LogoMark, PrimaryButtonLink } from "../design-system";
import { formatRoleName } from "../components/XRayReportSections";
import { formatScanDate } from "../lib/scanService";
import type { LatestScanSnapshot } from "../lib/useHomeDashboard";
import type { SavedScanSummary } from "../lib/profileService";
import type { ScanHistoryItem } from "../types";
import { cn } from "../lib/cn";

type ExistingUserHomeViewProps = {
  displayName: string;
  scans: SavedScanSummary[];
  generatedXrays: ScanHistoryItem[];
  latestSnapshot: LatestScanSnapshot | null;
  transitionCtaTo: string;
};

export function ExistingUserHomeView({
  displayName,
  scans,
  generatedXrays,
  latestSnapshot,
  transitionCtaTo,
}: ExistingUserHomeViewProps) {
  const latestXray = generatedXrays[0];

  return (
    <div className="space-y-5 pb-6">
      <header className="flex min-w-0 items-center gap-2.5">
        <LogoMark size={36} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">Future Trace</p>
          <p className="text-[10px] text-muted">Your AI Career Intelligence</p>
        </div>
      </header>

      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome back, {displayName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            You&apos;ve explored your options. Ready to take the next step?
          </p>
        </div>
        <img
          src="/images/home-hero.png"
          alt=""
          className="h-20 w-24 shrink-0 rounded-xl object-cover object-center opacity-90"
        />
      </section>

      <TransitionCtaBanner to={transitionCtaTo} />

      {latestSnapshot ? (
        <LatestScanSnapshotSection snapshot={latestSnapshot} />
      ) : null}

      {generatedXrays.length > 0 ? (
        <>
          <XRayCarousel items={generatedXrays} />
          {generatedXrays.length > 1 ? (
            <Link
              to={`/compare-goals/${generatedXrays[0]?.xray?.id}`}
              className="block text-center text-sm font-medium text-accent-purple ft-focus-ring"
            >
              Compare your latest X-Rays
            </Link>
          ) : null}
        </>
      ) : null}

      <ContinueExploringSection latestScanId={latestXray?.id} />

      <RecentScansSection scans={scans} />
    </div>
  );
}

function TransitionCtaBanner({ to }: { to: string }) {
  const features = [
    { icon: "🗺️", label: "Personalized Roadmap" },
    { icon: "📅", label: "Weekly Milestones" },
    { icon: "📈", label: "Progress Tracking" },
    { icon: "🔔", label: "Smart Reminders" },
  ];

  return (
    <section className="rounded-2xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/15 via-navy-card to-navy-card p-4">
      <h2 className="text-base font-bold leading-snug text-white">
        Ready to reach your goal?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Create your AI Career Transition plan and get a weekly roadmap, milestones and reminders.
      </p>
      <PrimaryButtonLink
        to={to}
        fullWidth
        className="mt-4 bg-gradient-to-r from-accent-purple to-accent-gold shadow-accent-purple/25"
      >
        Start My Transition Plan →
      </PrimaryButtonLink>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {features.map((f) => (
          <div key={f.label} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span aria-hidden>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LatestScanSnapshotSection({ snapshot }: { snapshot: LatestScanSnapshot }) {
  const metrics = [
    {
      label: "AI Exposure",
      value: `${snapshot.aiExposure}/100`,
      sub: snapshot.aiExposureLabel,
      tone: "text-accent-purple",
      iconBg: "bg-accent-purple/15 text-accent-purple",
      icon: <ExposureIcon />,
    },
    {
      label: "Career Resilience",
      value: `${snapshot.resilience}/100`,
      sub: snapshot.resilienceLabel,
      tone: "text-accent-gold",
      iconBg: "bg-accent-gold/15 text-accent-gold",
      icon: <ShieldIcon />,
    },
    {
      label: "Automation Risk",
      value: `${snapshot.automationRisk}%`,
      sub: snapshot.automationRiskLabel,
      tone: "text-danger",
      iconBg: "bg-danger/15 text-danger",
      icon: <RiskIcon />,
    },
    {
      label: "Future Opportunity",
      value: snapshot.opportunity,
      sub: snapshot.opportunityLabel,
      tone: "text-accent",
      iconBg: "bg-accent/15 text-accent",
      icon: <OpportunityIcon />,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Your latest scan snapshot</h2>
        <Link to={`/results/${snapshot.scanId}`} className="text-[11px] font-medium text-accent">
          View full report →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/8 bg-navy-card p-3">
            <div className="flex items-start gap-2">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", m.iconBg)}>
                {m.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{m.label}</p>
                <p className={cn("mt-0.5 text-sm font-bold tabular-nums", m.tone)}>{m.value}</p>
                <p className="text-[10px] text-muted">{m.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function XRayCarousel({ items }: { items: ScanHistoryItem[] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Your career X-Rays</h2>
        <Link to="/xray-history" className="text-[11px] font-medium text-accent">
          View all →
        </Link>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {items.map((item, index) => {
          const score = item.xray?.result?.report.futureReadinessScore ?? null;
          const isLatest = index === 0;
          return (
            <Link
              key={item.id}
              to={`/xray/${item.id}`}
              className="w-[72%] shrink-0 rounded-2xl border border-white/8 bg-navy-card p-4 transition hover:border-accent/30 ft-focus-ring sm:w-[280px]"
            >
              {isLatest ? (
                <span className="mb-2 inline-block rounded-full bg-accent-purple/20 px-2 py-0.5 text-[9px] font-bold uppercase text-accent-purple">
                  Latest
                </span>
              ) : (
                <span className="mb-2 inline-block rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-bold uppercase text-muted">
                  Completed
                </span>
              )}
              <p className="text-sm font-bold leading-snug text-white">
                {formatRoleName(item.currentRole)} → {formatRoleName(item.targetRole)}
              </p>
              {score != null ? (
                <>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                    {score}
                    <span className="text-sm font-normal text-muted">/100</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </>
              ) : null}
              <p className="mt-2 text-[10px] text-muted">
                {item.xray?.generatedAt ? formatScanDate(item.xray.generatedAt) : formatScanDate(item.createdAt)}
              </p>
            </Link>
          );
        })}
        <Link
          to="/scan"
          className="flex w-[40%] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center transition hover:border-accent/30 ft-focus-ring sm:w-[140px]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-muted">
            +
          </span>
          <p className="mt-2 text-xs font-medium text-muted">Run New X-Ray</p>
        </Link>
      </div>
    </section>
  );
}

function ContinueExploringSection({ latestScanId }: { latestScanId?: string }) {
  const cards = [
    {
      title: "Run Another Career X-Ray",
      desc: "Analyze another role or transition in depth.",
      cta: "Run X-Ray →",
      to: "/scan",
    },
    {
      title: "Explore Career Options",
      desc: "Discover in-demand roles and emerging opportunities.",
      cta: "Explore →",
      to: latestScanId ? `/transition-paths/${latestScanId}` : "/xray-history",
    },
    {
      title: "Learn & Grow",
      desc: "Resources, guides and insights to future-proof your career.",
      cta: "Learn More →",
      to: "/upgrade?product=transition",
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">Continue exploring</h2>
      <div className="space-y-2.5">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="block rounded-xl border border-white/8 bg-navy-card px-4 py-3 transition hover:border-white/15 ft-focus-ring"
          >
            <p className="text-sm font-semibold text-white">{card.title}</p>
            <p className="mt-0.5 text-xs text-muted">{card.desc}</p>
            <p className="mt-2 text-xs font-medium text-accent">{card.cta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentScansSection({ scans }: { scans: SavedScanSummary[] }) {
  const recent = scans.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Recent scans</h2>
        <Link to="/xray-history" className="text-[11px] font-medium text-accent">
          View all history →
        </Link>
      </div>
      <ul className="space-y-2">
        {recent.map((scan, index) => (
          <li key={scan.id}>
            <Link
              to={`/results/${scan.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-navy-card px-4 py-3 transition hover:border-white/15 ft-focus-ring"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{scan.currentRole}</p>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      Latest
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px] text-muted">Scanned on {scan.date}</p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-white">
                {scan.resilienceScore ?? "—"}
                <span className="text-xs font-normal text-muted">/100</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExposureIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7l8-4z" />
    </svg>
  );
}

function RiskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

function OpportunityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14l4-4 4 4 8-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
