import { useLocation } from "react-router-dom";
import { PrimaryButtonLink, SecondaryButtonLink } from "../design-system";
import { careerScans, getScanById } from "../data/mockData";
import { cn } from "../lib/cn";

type ResultsLocationState = {
  scanId?: string;
};

const STATUS = "Future-ready with moderate AI exposure";

const UNLOCK_TAGS = ["Task-by-task breakdown", "90-day action plan", "Salary forecasts"] as const;

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2z" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
    </svg>
  );
}

function InsightBar({
  label,
  tone,
  trailingIcon,
}: {
  label: string;
  tone: "strength" | "vulnerability" | "opportunity";
  trailingIcon: React.ReactNode;
}) {
  const styles = {
    strength: {
      bar: "bg-emerald-500/10 border-emerald-500/20",
      dot: "bg-emerald-400",
      icon: "text-emerald-400",
    },
    vulnerability: {
      bar: "bg-amber-500/10 border-amber-500/25",
      dot: "bg-amber-400",
      icon: "text-amber-400",
    },
    opportunity: {
      bar: "bg-accent/10 border-accent/25",
      dot: "bg-accent",
      icon: "text-accent",
    },
  }[tone];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3",
        styles.bar
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
      <span className="min-w-0 flex-1 text-sm text-white">{label}</span>
      <span className={cn("shrink-0", styles.icon)}>{trailingIcon}</span>
    </div>
  );
}

function InsightSection({
  title,
  icon,
  iconClass,
  items,
  tone,
  trailingIcon,
}: {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  items: string[];
  tone: "strength" | "vulnerability" | "opportunity";
  trailingIcon: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white/5", iconClass)}>
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <InsightBar key={item} label={item} tone={tone} trailingIcon={trailingIcon} />
        ))}
      </div>
    </section>
  );
}

export default function ScanResultsPage() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const scan = getScanById(state?.scanId ?? "scan-1") ?? careerScans[0];

  if (!scan) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted">No scan results yet.</p>
        <PrimaryButtonLink to="/scan" fullWidth className="mt-4">
          Run free scan
        </PrimaryButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-2">
      <h1 className="text-center text-lg font-semibold tracking-tight text-white">Career Assessment</h1>

      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-accent-purple/25 via-[#1a1f35] to-accent/15 px-5 py-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-accent-soft">
          <SparkleIcon />
          <span>Career Resilience Index</span>
        </div>
        <p className="text-5xl font-bold tabular-nums tracking-tight text-white">
          {scan.resilienceScore}
          <span className="text-2xl font-normal text-muted">/100</span>
        </p>
        <p className="mt-3 text-sm font-medium text-emerald-400">{STATUS}</p>
      </div>

      <InsightSection
        title="Strengths"
        icon={<TrendUpIcon />}
        iconClass="text-emerald-400"
        items={scan.strengths}
        tone="strength"
        trailingIcon={<SparkleIcon />}
      />

      <InsightSection
        title="Vulnerabilities"
        icon={<WarningIcon />}
        iconClass="text-amber-400"
        items={scan.vulnerabilities}
        tone="vulnerability"
        trailingIcon={<WarningIcon />}
      />

      <InsightSection
        title="Opportunity Zones"
        icon={<TargetIcon />}
        iconClass="text-accent"
        items={scan.opportunityZones}
        tone="opportunity"
        trailingIcon={<TargetIcon />}
      />

      <div className="rounded-2xl border border-accent-purple/25 bg-navy-card p-4">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple">
            <LockIcon />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">Unlock deeper insights</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Get your full Career X-Ray with detailed task-level AI exposure analysis, salary
              projections, and personalized transition roadmap.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {UNLOCK_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <PrimaryButtonLink to="/career-xray" fullWidth className="flex items-center justify-center gap-2">
          <SparkleIcon />
          Unlock Career X-Ray
        </PrimaryButtonLink>
        <SecondaryButtonLink to="/upgrade" fullWidth className="flex items-center justify-center gap-2 text-sm">
          <CalendarIcon />
          Track My Career Monthly
        </SecondaryButtonLink>
      </div>
    </div>
  );
}
