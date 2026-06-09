import { Link } from "react-router-dom";
import { LogoMark, PrimaryButtonLink } from "../design-system";
import { products } from "../data/mockData";
import type { LatestScanSnapshot } from "../lib/useHomeDashboard";
import type { SavedScanSummary } from "../lib/profileService";
import { cn } from "../lib/cn";

type ScansOnlyHomeViewProps = {
  displayName: string;
  scans: SavedScanSummary[];
  latestSnapshot: LatestScanSnapshot | null;
  scanTo: string;
  transitionCtaTo: string;
};

export function ScansOnlyHomeView({
  displayName,
  scans,
  latestSnapshot,
  scanTo,
  transitionCtaTo,
}: ScansOnlyHomeViewProps) {
  const latestScanId = scans[0]?.id;
  const scanCount = scans.length;

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
            You have {scanCount} past {scanCount === 1 ? "scan" : "scans"}. Ready to take the next step?
          </p>
        </div>
        <img
          src="/images/home-hero.png"
          alt=""
          className="h-20 w-24 shrink-0 rounded-xl object-cover object-center opacity-90"
        />
      </section>

      <NewScanCard scanTo={scanTo} />

      {latestSnapshot ? <LatestScanInsights snapshot={latestSnapshot} /> : null}

      <PastScansList scans={scans} />

      <RecommendedNextSteps latestScanId={latestScanId} transitionCtaTo={transitionCtaTo} />

      <GrowthBanner scanTo={scanTo} resilience={latestSnapshot?.resilience} />
    </div>
  );
}

function NewScanCard({ scanTo }: { scanTo: string }) {
  const features = ["AI Exposure Score", "Career Resilience", "Future Opportunities"];

  return (
    <section className="rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/10 to-navy-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
            Free
          </span>
          <h2 className="mt-2 text-base font-bold text-white">Run a New Career Scan</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Get updated insights about your AI exposure, strengths, risks and opportunities.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {features.map((label) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-muted">
                <span className="h-1 w-1 rounded-full bg-accent-purple" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <PrimaryButtonLink
          to={scanTo}
          className="shrink-0 bg-gradient-to-r from-accent-purple to-accent-gold px-5 shadow-accent-purple/20 sm:min-w-[140px]"
        >
          Start New Scan →
        </PrimaryButtonLink>
      </div>
    </section>
  );
}

function LatestScanInsights({ snapshot }: { snapshot: LatestScanSnapshot }) {
  const metrics = [
    {
      label: "AI Exposure",
      value: `${snapshot.aiExposure}/100`,
      sub: snapshot.aiExposureLabel,
      tone: "text-success",
      iconBg: "bg-success/15 text-success",
    },
    {
      label: "Career Resilience",
      value: `${snapshot.resilience}/100`,
      sub: snapshot.resilienceLabel,
      tone: "text-accent-gold",
      iconBg: "bg-accent-gold/15 text-accent-gold",
    },
    {
      label: "Automation Risk",
      value: `${snapshot.automationRisk}%`,
      sub: snapshot.automationRiskLabel,
      tone: "text-danger",
      iconBg: "bg-danger/15 text-danger",
    },
    {
      label: "Future Opportunity",
      value: snapshot.opportunity,
      sub: snapshot.opportunityLabel,
      tone: "text-accent",
      iconBg: "bg-accent/15 text-accent",
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Your latest scan insights</h2>
        <Link to={`/results/${snapshot.scanId}`} className="text-[11px] font-medium text-accent">
          View full report →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/8 bg-navy-card p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{m.label}</p>
            <p className={cn("mt-1 text-lg font-bold tabular-nums", m.tone)}>{m.value}</p>
            <p className="text-[10px] text-muted">{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PastScansList({ scans }: { scans: SavedScanSummary[] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Your past scans</h2>
        <Link to="/xray-history" className="text-[11px] font-medium text-accent">
          View all →
        </Link>
      </div>
      <ul className="space-y-2">
        {scans.slice(0, 5).map((scan, index) => (
          <li key={scan.id}>
            <Link
              to={`/results/${scan.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-navy-card px-4 py-3 transition hover:border-white/15 ft-focus-ring"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{scan.currentRole}</p>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full bg-accent-purple/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-purple">
                      Latest
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px] text-muted">{scan.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-bold tabular-nums text-white">
                  {scan.resilienceScore ?? "—"}
                  <span className="text-xs font-normal text-muted">/100</span>
                </p>
                <ChevronIcon />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecommendedNextSteps({
  latestScanId,
  transitionCtaTo,
}: {
  latestScanId?: string;
  transitionCtaTo: string;
}) {
  const { xray, radar } = products;
  const cards = [
    {
      title: "Career X-Ray",
      desc: "Analyze a specific career transition in depth.",
      price: `From ${xray.price}`,
      to: latestScanId ? `/results/${latestScanId}` : "/xray-history",
      border: "border-accent-purple/30",
      bg: "from-accent-purple/10",
      accent: "text-accent-purple",
      btnClass: "bg-accent-purple/20 text-accent-purple",
    },
    {
      title: "AI Career Transition",
      desc: "Get a personalized weekly plan to reach your goal.",
      price: `${radar.price} / month`,
      to: transitionCtaTo,
      border: "border-accent/30",
      bg: "from-accent/10",
      accent: "text-accent",
      btnClass: "bg-accent/20 text-accent",
    },
    {
      title: "Explore Careers",
      desc: "Discover in-demand roles and future opportunities.",
      price: null,
      to: latestScanId ? `/transition-paths/${latestScanId}` : "/scan",
      border: "border-success/30",
      bg: "from-success/10",
      accent: "text-success",
      btnClass: "bg-success/20 text-success",
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">Recommended next steps</h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className={cn(
              "flex flex-col rounded-xl border bg-gradient-to-br to-navy-card p-3 transition hover:border-white/20 ft-focus-ring",
              card.border,
              card.bg
            )}
          >
            <p className={cn("text-xs font-bold", card.accent)}>{card.title}</p>
            <p className="mt-1 flex-1 text-[10px] leading-relaxed text-muted">{card.desc}</p>
            {card.price ? (
              <p className="mt-2 text-[10px] font-semibold text-white">{card.price}</p>
            ) : null}
            <span
              className={cn(
                "mt-3 inline-flex h-7 w-7 items-center justify-center self-end rounded-lg text-sm",
                card.btnClass
              )}
              aria-hidden
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function GrowthBanner({ scanTo, resilience }: { scanTo: string; resilience?: number }) {
  const growth = resilience != null ? Math.max(5, Math.round((resilience - 50) / 4)) : 12;

  return (
    <section className="rounded-xl border border-accent-gold/25 bg-gradient-to-r from-accent-gold/10 to-accent-purple/5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gold/15 text-accent-gold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14l4-4 4 4 8-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-accent-gold">+{growth}%</p>
            <p className="text-[11px] leading-relaxed text-muted">
              Growth is a journey, not a race. Keep scanning. Keep learning. Keep growing.
            </p>
          </div>
        </div>
        <Link
          to={scanTo}
          className="shrink-0 rounded-lg bg-accent-gold/20 px-3 py-1.5 text-[11px] font-semibold text-accent-gold transition hover:bg-accent-gold/30 ft-focus-ring"
        >
          Keep Going →
        </Link>
      </div>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
