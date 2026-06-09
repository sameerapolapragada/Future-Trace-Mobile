import { PrimaryButtonLink } from "../design-system";
import { cn } from "../lib/cn";
import type {
  TransitionDifficulty,
  TransitionFit,
  XRayCompleteReport,
  XRayGapLevel,
  XRayImpactLevel,
} from "../types";

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
      <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted">{label}</p>
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
      <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-muted">{label}</p>
    </div>
  );
}

type XRayReportSectionsProps = {
  report: XRayCompleteReport;
  scanId: string;
  showTransitionPathsCta?: boolean;
};

export function XRayReportSections({
  report,
  scanId,
  showTransitionPathsCta = true,
}: XRayReportSectionsProps) {
  const { recommendedAction, transitionSnapshot } = report;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-navy-card/90 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-3 gap-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Current Role</p>
          <div className="row-span-2 flex items-center self-center pt-4 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-right text-[9px] font-bold uppercase tracking-wider text-success">Target Role</p>
          <p className="text-sm font-bold leading-snug text-white">{formatRoleName(report.currentRole)}</p>
          <p className="text-right text-sm font-bold leading-snug text-white">
            {formatRoleName(report.targetRole)}
          </p>
        </div>

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
            icon={<span className="text-success">✓</span>}
            label="Transition Fit"
            value={report.transitionFit}
            valueClass={fitColor(report.transitionFit)}
          />
          <MetricTile
            icon={<span className="text-danger">▮</span>}
            label="Difficulty"
            value={report.transitionDifficulty}
            valueClass={difficultyColor(report.transitionDifficulty)}
          />
          <MetricTile
            icon={<span className="text-accent">⏱</span>}
            label="Est. Time"
            value={report.estimatedTransitionTime}
            valueClass="text-accent text-[11px]"
          />
        </div>
      </div>

      <section className="rounded-2xl border border-accent/20 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">Salary Outlook</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Current</p>
            <p className="mt-1 text-sm font-bold text-white">{report.currentSalaryRange}</p>
          </div>
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

      <section className="rounded-2xl border border-success/20 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-success">
          Transferable Strengths
        </h2>
        <div className="space-y-3">
          {report.transferableStrengths.map((strength) => (
            <div key={strength.name}>
              <p className="text-[11px] font-semibold text-white">{strength.name}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">{strength.whyItMatters}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-danger/20 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-danger">Skill Gaps</h2>
        <div className="space-y-3">
          {report.skillGaps.map((gap) => (
            <div key={gap.skill} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold text-white">{gap.skill}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                    gapPillClass(gap.gap)
                  )}
                >
                  {gap.gap.replace(" Gap", "")}
                </span>
                <span className={cn("text-[10px] font-semibold", impactClass(gap.impact))}>
                  {gap.impact.replace(" Impact", "")}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">{gap.whyItMatters}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-accent/25 bg-navy-card/90 p-4">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-accent">Recommended Action</h2>
        <p className="text-sm font-semibold text-white">{recommendedAction.primaryAction}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{recommendedAction.why}</p>
        <ul className="mt-3 space-y-2">
          {recommendedAction.next30Days.map((item) => (
            <li key={item} className="text-[11px] text-white/90">
              • {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-success">Expected Impact</span>
          <span className="text-sm font-bold text-success">{recommendedAction.expectedImpact}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card/90 px-2 py-4">
        <h2 className="mb-3 px-2 text-center text-[10px] font-bold uppercase tracking-widest text-white">
          Transition Snapshot
        </h2>
        <div className="flex overflow-x-auto">
          <SnapshotItem value={transitionSnapshot.transitionTime} label="Time" valueClass="text-white" icon="⏱" />
          <SnapshotItem
            value={transitionSnapshot.difficulty}
            label="Difficulty"
            valueClass={difficultyColor(transitionSnapshot.difficulty)}
            icon="▮"
          />
          <SnapshotItem
            value={`${transitionSnapshot.readiness}/100`}
            label="Readiness"
            valueClass="text-accent"
            icon="◎"
          />
          <SnapshotItem
            value={transitionSnapshot.salaryUpside}
            label="Salary Upside"
            valueClass="text-success"
            icon="$"
          />
          <SnapshotItem
            value={transitionSnapshot.marketDemand}
            label="Market Demand"
            valueClass="text-accent"
            icon="↗"
          />
        </div>
      </section>

      {showTransitionPathsCta ? (
        <PrimaryButtonLink
          to={`/transition-paths/${scanId}`}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          Explore Transition Paths
        </PrimaryButtonLink>
      ) : null}
    </div>
  );
}

export { formatRoleName, difficultyColor };
