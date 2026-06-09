import { useNavigate } from "react-router-dom";
import { PrimaryButton, PrimaryButtonLink } from "../design-system";
import { useEntitlements } from "../lib/entitlements";
import { useCareerXRayData } from "../lib/useCareerXRayData";
import { cn } from "../lib/cn";
import type { TransitionDifficulty, TransitionFit, XRayGapLevel, XRayImpactLevel } from "../types";

function formatRoleName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("/")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("/")
    )
    .join(" ");
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent transition hover:text-accent-soft ft-focus-ring"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#00b4ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" className="fill-white text-[9px] font-bold">
        {score}
      </text>
    </svg>
  );
}

function SalaryBarChart() {
  return (
    <div className="flex h-16 items-end justify-center gap-2 px-2" aria-hidden>
      <div className="flex w-8 flex-col items-center gap-1">
        <div className="w-full rounded-t bg-white/20" style={{ height: "48%" }} />
        <span className="text-[8px] text-muted">Now</span>
      </div>
      <div className="flex w-8 flex-col items-center gap-1">
        <div className="w-full rounded-t bg-success/70" style={{ height: "72%" }} />
        <span className="text-[8px] text-success">Target</span>
      </div>
    </div>
  );
}

function gapPillClass(gap: XRayGapLevel) {
  if (gap === "Large Gap") return "border-transparent bg-danger/25 text-danger";
  if (gap === "Moderate Gap") return "border-danger/40 bg-danger/8 text-accent-gold";
  return "border-accent/40 bg-accent/8 text-accent";
}

function impactClass(impact: XRayImpactLevel) {
  return impact === "High Impact" ? "text-danger" : "text-accent";
}

function fitColor(fit: TransitionFit) {
  if (fit === "Strong") return "text-success";
  if (fit === "Moderate") return "text-accent";
  return "text-danger";
}

function difficultyColor(difficulty: TransitionDifficulty) {
  if (difficulty === "Low") return "text-success";
  if (difficulty === "Medium") return "text-accent";
  return "text-danger";
}

function MetricTile({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/8 bg-black/30 px-2 py-3 text-center">
      <div className="mb-2">{icon}</div>
      <p className={cn("text-sm font-bold leading-tight", valueClass)}>{value}</p>
      <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}

function SnapshotItem({
  icon,
  value,
  label,
  valueClass,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-[72px] flex-1 flex-col items-center px-1 text-center">
      <div className="mb-1.5 text-accent">{icon}</div>
      <p className={cn("text-[11px] font-bold leading-tight", valueClass)}>{value}</p>
      <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CareerXRayCompleteView() {
  const navigate = useNavigate();
  const { entitlements } = useEntitlements();
  const { report, loading, error } = useCareerXRayData();
  const radarTo = entitlements.hasRadar ? "/radar" : "/upgrade";

  if (loading || !report) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-red-400">{error}</p>;
  }

  const { recommendedAction, transitionSnapshot } = report;
  const xrayId = report.xrayId ?? "XR-00000";

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <BackButton onClick={() => navigate("/home")} />
        <h1 className="flex-1 text-center text-xs font-bold uppercase tracking-widest text-white">
          Career X-Ray Complete
        </h1>
        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-muted">
          X-RAY ID: {xrayId}
        </span>
      </div>

      {/* Role comparison hero */}
      <div className="rounded-2xl border border-accent/20 bg-navy-card/90 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-3 gap-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Current Role</p>
          <div className="row-span-2 flex items-center self-center pt-4 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-right text-[9px] font-bold uppercase tracking-wider text-success">Target Role</p>

          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0 text-accent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-sm font-bold leading-snug text-white">
              {formatRoleName(report.currentRole)}
            </p>
          </div>

          <div className="flex items-start justify-end gap-1.5 text-right">
            <p className="text-sm font-bold leading-snug text-white">
              {formatRoleName(report.targetRole)}
            </p>
            <span className="mt-0.5 shrink-0 text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </span>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <MetricTile
            icon={<ReadinessRing score={report.futureReadinessScore} />}
            label="Future Readiness"
            value={
              <>
                {report.futureReadinessScore}
                <span className="text-[10px] font-normal text-muted">/100</span>
              </>
            }
            valueClass="text-accent"
          />
          <MetricTile
            icon={
              <span className="text-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3 3 10v11h18V10L12 3z" strokeLinejoin="round" />
                  <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            }
            label="Transition Fit"
            value={report.transitionFit}
            valueClass={fitColor(report.transitionFit)}
          />
          <MetricTile
            icon={
              <span className="text-danger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="12" width="4" height="8" rx="1" />
                  <rect x="10" y="8" width="4" height="12" rx="1" />
                  <rect x="16" y="4" width="4" height="16" rx="1" />
                </svg>
              </span>
            }
            label="Difficulty"
            value={report.transitionDifficulty}
            valueClass={difficultyColor(report.transitionDifficulty)}
          />
          <MetricTile
            icon={
              <span className="text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
              </span>
            }
            label="Est. Time"
            value={report.estimatedTransitionTime}
            valueClass="text-accent text-[11px]"
          />
        </div>
      </div>

      {/* Salary Outlook */}
      <section className="rounded-2xl border border-accent/20 bg-navy-card/90 p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Salary Outlook</h2>
          <span className="text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Current</p>
            <p className="mt-1 text-sm font-bold text-white">{report.currentSalaryRange}</p>
          </div>
          <SalaryBarChart />
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wide text-success">Target</p>
            <p className="mt-1 text-sm font-bold text-success">{report.targetSalaryRange}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-success">Potential Upside</span>
          <span className="text-sm font-bold text-success">{report.salaryUpside}</span>
        </div>
        <p className="mt-2 text-center text-[9px] text-muted">
          Estimates vary by location, company, and experience.
        </p>
      </section>

      {/* Transferable Strengths */}
      <section className="rounded-2xl border border-success/20 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-success">
          Your Transferable Strengths
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.transferableStrengths.map((strength) => (
            <div key={strength.name} className="text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3 3 10v11h18V10L12 3z" strokeLinejoin="round" />
                  <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[11px] font-semibold text-white">{strength.name}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">{strength.whyItMatters}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skill Gaps table */}
      <section className="rounded-2xl border border-danger/20 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-danger">
          Your Skill Gaps
        </h2>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/8 text-[8px] font-bold uppercase tracking-wide text-muted">
                <th className="px-2 py-2">Skill</th>
                <th className="px-2 py-2">Gap</th>
                <th className="px-2 py-2">Impact</th>
                <th className="px-2 py-2">Why It Matters</th>
              </tr>
            </thead>
            <tbody>
              {report.skillGaps.map((gap) => (
                <tr key={gap.skill} className="border-b border-white/5 last:border-b-0">
                  <td className="px-2 py-2.5 text-[11px] font-semibold text-white">{gap.skill}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                        gapPillClass(gap.gap)
                      )}
                    >
                      {gap.gap.replace(" Gap", "")}
                    </span>
                  </td>
                  <td className={cn("px-2 py-2.5 text-[10px] font-semibold", impactClass(gap.impact))}>
                    {gap.impact.replace(" Impact", "")}
                  </td>
                  <td className="px-2 py-2.5 text-[10px] leading-relaxed text-muted">{gap.whyItMatters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recommended Action */}
      <section className="rounded-2xl border border-accent/25 bg-navy-card/90 p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent">Recommended Action</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-accent">Primary Action</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">
              {recommendedAction.primaryAction}
            </p>
            <p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-accent">Why</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{recommendedAction.why}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-accent">Next 30 Days</p>
            <ul className="mt-2 space-y-2">
              {recommendedAction.next30Days.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-white/90">
                  <span className="mt-0.5 shrink-0 text-accent">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-success">Expected Impact</span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14l4-4 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 6h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {recommendedAction.expectedImpact}
          </span>
        </div>
      </section>

      <div className="flex justify-center">
        <PrimaryButton
          type="button"
          disabled
          className="!gap-1 !px-3 !py-2 text-[10px] font-bold uppercase tracking-wide"
        >
          Transition Path (Coming Soon)
        </PrimaryButton>
      </div>

      {/* Transition Snapshot */}
      <section className="rounded-2xl border border-white/8 bg-navy-card/90 px-2 py-4">
        <h2 className="mb-3 px-2 text-center text-[10px] font-bold uppercase tracking-widest text-white">
          Transition Snapshot
        </h2>
        <div className="flex overflow-x-auto">
          <SnapshotItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            }
            value={transitionSnapshot.transitionTime}
            label="Transition Time"
            valueClass="text-white"
          />
          <SnapshotItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="12" width="4" height="8" rx="1" />
                <rect x="10" y="8" width="4" height="12" rx="1" />
                <rect x="16" y="4" width="4" height="16" rx="1" />
              </svg>
            }
            value={transitionSnapshot.difficulty}
            label="Difficulty"
            valueClass={difficultyColor(transitionSnapshot.difficulty)}
          />
          <SnapshotItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 3 10v11h18V10L12 3z" strokeLinejoin="round" />
              </svg>
            }
            value={
              <>
                {transitionSnapshot.readiness}
                <span className="text-[9px] font-normal text-muted">/100</span>
              </>
            }
            label="Readiness"
            valueClass="text-accent"
          />
          <SnapshotItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
              </svg>
            }
            value={transitionSnapshot.salaryUpside}
            label="Salary Upside"
            valueClass="text-success"
          />
          <SnapshotItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 14l4-4 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            value={transitionSnapshot.marketDemand}
            label="Market Demand"
            valueClass="text-accent"
          />
        </div>
      </section>

      {/* Footer CTAs */}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButtonLink
          to="/career-opportunities"
          fullWidth
          className="!gap-0.5 !px-1.5 !py-3 !text-[8px] font-bold uppercase leading-none tracking-tight whitespace-nowrap"
        >
          Explore Transition Roles
          <ChevronRight />
        </PrimaryButtonLink>

        <PrimaryButtonLink
          to={radarTo}
          fullWidth
          className="!gap-0.5 !px-1.5 !py-3 !text-[8px] font-bold uppercase leading-none tracking-tight whitespace-nowrap"
        >
          {entitlements.hasRadar ? "Open AI Career Radar" : "Activate AI Career Radar"}
          <ChevronRight />
        </PrimaryButtonLink>
      </div>
    </div>
  );
}
