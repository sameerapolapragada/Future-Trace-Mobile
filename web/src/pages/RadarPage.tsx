import { Link, useNavigate } from "react-router-dom";
import { PaywallCard, PrimaryButtonLink } from "../design-system";
import { getCareerXRaySnapshot, products, radarDashboard, userProfile } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import { cn } from "../lib/cn";
import type { RadarMatchLevel } from "../types";

function matchTone(match: RadarMatchLevel) {
  if (match === "High") return "text-success bg-success/15";
  if (match === "Medium") return "text-accent-gold bg-accent-gold/15";
  return "text-danger bg-danger/15";
}

function SubMetricBar({
  label,
  value,
  barClass,
}: (typeof radarDashboard.subMetrics)[number]) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums text-white">{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/8">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BulletList({ items, tone }: { items: string[]; tone: "strength" | "weakness" }) {
  const dot = tone === "strength" ? "bg-success" : "bg-danger";
  const headingTone = tone === "strength" ? "text-success" : "text-danger";

  return (
    <div className="rounded-xl border border-white/8 bg-navy-card p-3">
      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", headingTone)}>
        {tone === "strength" ? "Strengths" : "Weaknesses"}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-muted">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RadarDashboardContent() {
  const d = radarDashboard;
  const careerXRay = getCareerXRaySnapshot();

  return (
    <div className="space-y-5 pb-2">
      <header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold uppercase tracking-widest text-white">
                AI Career Radar
              </h1>
              <span className="rounded bg-accent-purple/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-gold">
                Beta
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">Personalized insights for your career development</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-muted transition hover:text-white ft-focus-ring"
            >
              Share
            </button>
            <Link
              to="/profile"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ft-avatar-gradient ft-focus-ring"
              aria-label="Profile"
            >
              {userProfile.name.charAt(0)}
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-white">
            {d.readinessScore}
            <span className="text-lg font-normal text-muted">%</span>
          </p>
          <p className="mt-1 text-sm font-bold uppercase tracking-wide text-accent">
            {d.readinessLabel}
          </p>
          <p className="mt-1 text-xs text-muted">{d.peerPercentile}</p>
          <p className="mt-1 text-xs font-medium text-success">{d.scoreTrend}</p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold"
            style={{ width: `${d.readinessScore}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {d.subMetrics.map((metric) => (
            <SubMetricBar key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <BulletList items={d.strengths} tone="strength" />
        <BulletList items={d.weaknesses} tone="weakness" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-navy-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-white">How to improve your AI Readiness score</p>
        <button
          type="button"
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white ft-btn-primary ft-focus-ring"
        >
          View Action Plan
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
          Best Career Paths for You
        </h2>
        <div className="space-y-3">
          {d.careerPaths.map((path) => (
            <div
              key={path.title}
              className="rounded-2xl border border-white/8 bg-navy-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white">{path.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{path.description}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    matchTone(path.match)
                  )}
                >
                  {path.match}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Salary: <span className="font-medium text-white">{path.salary}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
          Market Demand for AI Roles
        </h2>
        <div className="space-y-2">
          {d.marketDemand.map((row) => (
            <div
              key={row.title}
              className="rounded-xl border border-white/8 bg-navy-card p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{row.title}</p>
                  <p className="mt-1 text-xs text-muted">{row.openings}</p>
                  <p className="mt-0.5 text-xs text-muted">{row.salary}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded bg-accent-purple/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-purple">
                    {row.demandTag}
                  </span>
                  <button
                    type="button"
                    className="text-[10px] font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
          Skills Gap Analysis
        </h2>
        <div className="space-y-4 rounded-2xl border border-white/8 bg-navy-card p-4">
          {d.skillGaps.map((skill) => (
            <div key={skill.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-white">{skill.name}</span>
                <span className="tabular-nums text-muted">
                  {skill.current}% / {skill.target}%
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/10"
                  style={{ width: `${skill.target}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-purple"
                  style={{ width: `${skill.current}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white">
          Recommended Learning Path
        </h2>
        <h3 className="mt-2 text-sm font-bold text-white">{d.learningPath.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">{d.learningPath.description}</p>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
            <span>Progress</span>
            <span>{d.learningPath.progress}% complete</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-gold"
              style={{ width: `${d.learningPath.progress}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span>{d.learningPath.duration}</span>
          <span className="text-accent-gold">{d.learningPath.points}</span>
        </div>
        <PrimaryButtonLink to="/upgrade" fullWidth className="mt-4 flex items-center justify-center gap-2">
          View Learning Resources
        </PrimaryButtonLink>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white">Career X-Ray</h2>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] uppercase text-muted">Current</p>
            <p className="mt-1 text-xs font-semibold text-white">{careerXRay.currentRole}</p>
          </div>
          <div className="flex shrink-0 flex-col items-center px-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-lg font-bold tabular-nums text-white">
              {careerXRay.matchScore}%
            </p>
            <p className="text-[10px] text-muted">Match</p>
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] uppercase text-muted">Target</p>
            <p className="mt-1 text-xs font-semibold text-white">{careerXRay.targetRole}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RadarPage() {
  const navigate = useNavigate();
  const { entitlements, refresh } = useEntitlements();
  const { radar } = products;

  useCheckoutReturn(refresh);

  if (!entitlements.hasRadar) {
    return (
      <div className="space-y-4">
        <div className="pointer-events-none select-none">
          <div className="max-h-[360px] overflow-hidden opacity-50 blur-[2px]">
            <RadarDashboardContent />
          </div>
          <div className="pointer-events-none -mt-16 h-16 bg-gradient-to-b from-transparent to-navy" />
        </div>

        <PaywallCard
          badge="Monthly subscription"
          title={radar.name}
          description={radar.description}
          price={radar.price}
          priceSuffix={radar.priceSuffix}
          features={radar.features}
          primaryLabel="Start AI Career Radar"
          onPrimary={() => navigate("/upgrade")}
          secondaryTo="/home"
        />
      </div>
    );
  }

  return <RadarDashboardContent />;
}
