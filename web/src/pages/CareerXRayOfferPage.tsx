import { Navigate, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { products, transitionRadarPreview } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/8 hover:text-white ft-focus-ring"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function RadarChart() {
  const nodes = [
    { cx: 50, cy: 18, fill: "#F97316" },
    { cx: 82, cy: 42, fill: "#3498DB" },
    { cx: 72, cy: 78, fill: "#14B8A6" },
    { cx: 28, cy: 78, fill: "#FF5500" },
    { cx: 18, cy: 42, fill: "#FACC15" },
  ];

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <polygon
        points="50,18 82,42 72,78 28,78 18,42"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.8"
      />
      {nodes.map((node, i) => (
        <line key={i} x1="50" y1="50" x2={node.cx} y2={node.cy} stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
      ))}
      {nodes.map((node, i) => (
        <circle key={`n-${i}`} cx={node.cx} cy={node.cy} r="4" fill={node.fill} />
      ))}
      <circle cx="50" cy="50" r="10" fill="#F97316" fillOpacity="0.25" stroke="#F97316" strokeWidth="1" />
      <circle cx="50" cy="47" r="3" fill="white" fillOpacity="0.9" />
      <path d="M50 44v4M48 46h4" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function TransitionPathRow({
  rank,
  colorClass,
  numberClass,
  salary,
  salaryClass,
}: (typeof transitionRadarPreview.paths)[number]) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/6 bg-gradient-to-r px-3 py-2.5",
        colorClass
      )}
    >
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold", numberClass)}>
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90 blur-[4px] select-none">
          Senior Transition Role Title
        </p>
        <p className={cn("mt-0.5 text-xs font-semibold tabular-nums", salaryClass)}>{salary}</p>
      </div>
      <LockIcon className="shrink-0 text-white/50" />
    </div>
  );
}

export default function CareerXRayOfferPage() {
  const navigate = useNavigate();
  const { unlock, entitlements } = useEntitlements();
  const { xray, radar } = products;
  const preview = transitionRadarPreview;

  if (entitlements.hasCareerXRay) {
    return <Navigate to="/xray" replace />;
  }

  function purchaseXRay() {
    unlock("xray");
    navigate("/xray");
  }

  function purchaseRadar() {
    unlock("radar");
    navigate("/radar");
  }

  return (
    <div className="relative space-y-5 pb-4">
      <div className="pointer-events-none absolute -left-10 top-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-40 h-36 w-36 rounded-full bg-teal-500/10 blur-3xl" />

      <BackButton onClick={() => navigate(-1)} />

      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-[#0d111c] p-4 shadow-lg shadow-orange-500/5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold uppercase tracking-widest text-white">
              Your Transition Radar
            </h1>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="aspect-square max-h-[140px] rounded-xl border border-white/8 bg-black/30 p-3">
            <RadarChart />
          </div>
          <div className="flex w-[118px] flex-col gap-2">
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Match Strength</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-400">{preview.matchStrength}%</p>
              <p className="text-[9px] font-semibold text-emerald-400/80">{preview.matchLabel}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Market Momentum</p>
              <svg viewBox="0 0 60 24" className="mt-1 h-6 w-full text-emerald-400" aria-hidden>
                <polyline
                  points="0,20 12,16 24,18 36,10 48,12 60,4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-[10px] font-bold text-emerald-400">{preview.marketMomentum}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wide text-white">
              Your 5 Immediate Transition Paths
            </h2>
            <span className="flex items-center gap-1 text-[9px] font-semibold uppercase text-orange-400">
              <LockIcon className="text-orange-400" />
              Blurred for you
            </span>
          </div>
          <div className="space-y-2">
            {preview.paths.map((path) => (
              <TransitionPathRow key={path.rank} {...path} />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/6 pt-4">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 text-orange-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            </span>
            <p className="text-[11px] leading-relaxed text-muted">
              Live market data. Real opportunities. Personalized for{" "}
              <span className="font-bold text-orange-400">YOUR</span> background.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 text-right">
            <p className="text-[8px] font-medium uppercase tracking-wide text-muted">Opportunity Score</p>
            <p className="text-lg font-bold tabular-nums text-emerald-400">
              {preview.opportunityScore}
              <span className="text-xs font-normal text-muted">/100</span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative space-y-3">
        <PrimaryButton
          fullWidth
          onClick={purchaseXRay}
          className="flex items-center justify-center gap-2"
        >
          Unlock Career X-Ray — {xray.price}
        </PrimaryButton>
        <p className="text-center text-xs text-muted">
          One-time purchase · Full report · 5 transition roles · No subscription required
        </p>
      </div>

      <div className="relative rounded-2xl border border-accent-purple/30 bg-navy-card p-4">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-purple">
          Includes Career X-Ray
        </span>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-accent-gold text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <path d="M12 12 18 8" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">{radar.name}</h3>
            <p className="mt-0.5 text-xs text-muted">
              Get the full X-Ray snapshot plus live updates as the AI job market changes.
            </p>
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-white">
          {radar.price}
          <span className="text-base font-normal text-muted">/month</span>
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-muted">
          <li>· Everything in Career X-Ray included</li>
          <li>· Monthly skill gap movement & market signals</li>
          <li>· Personalized career alerts each month</li>
        </ul>
        <PrimaryButton fullWidth onClick={purchaseRadar} className="mt-4">
          Start AI Career Radar
        </PrimaryButton>
        <p className="mt-2 text-center text-[10px] text-muted">Cancel anytime · X-Ray included at no extra cost</p>
      </div>
    </div>
  );
}
