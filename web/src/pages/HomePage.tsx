import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, LogoMark, PrimaryButtonLink } from "../design-system";
import { homeDashboard } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2zm7 9l.9 2.8L22 14l-2.8.9L18 18l-.9-2.8L14 14l2.8-.9L18 11z" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FACC15" fillOpacity="0.2" stroke="#FACC15" strokeWidth="1.5" />
      <path d="M12 8v5" stroke="#FACC15" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.75" fill="#FACC15" />
    </svg>
  );
}

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

function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="shrink-0 text-xs font-medium text-accent transition hover:text-accent-soft">
      {label} &gt;
    </Link>
  );
}

function HelpHint({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1">
        <p className="text-xs text-muted">{label}</p>
        <button
          type="button"
          aria-label={`What is ${label}?`}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 text-[9px] font-bold text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
        >
          ?
        </button>
      </div>
      {open ? (
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{text}</p>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  topRight,
  value,
  label,
  labelHelp,
}: {
  icon?: React.ReactNode;
  topRight?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  labelHelp?: string;
}) {
  return (
    <Card
      padding="md"
      className="border border-white/8 bg-navy-card shadow-none"
    >
      {(icon || topRight) && (
        <div className={cn("mb-3 flex items-start justify-between", !icon && "justify-end")}>
          {icon}
          {topRight}
        </div>
      )}
      <p className="text-2xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      {labelHelp ? <HelpHint label={label} text={labelHelp} /> : <p className="mt-1 text-xs text-muted">{label}</p>}
    </Card>
  );
}

function CareerPathRow({
  title,
  salary,
  match,
  growth,
  barColor,
  badgeBg,
}: (typeof homeDashboard.careerPaths)[number]) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-0.5 text-xs text-muted">{salary}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", badgeBg)}>
            {match}% Match
          </span>
          <p className="mt-1 text-xs font-medium tabular-nums text-emerald-400">{growth}</p>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${match}%` }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { entitlements } = useEntitlements();
  const xrayTo = entitlements.hasCareerXRay ? "/xray" : "/career-xray";

  return (
    <div className="ft-display-page relative space-y-5 pb-4">
      <header className="flex items-center gap-3">
        <LogoMark size={44} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Your AI Career Intelligence Dashboard</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          topRight={
            <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
              <TrendUpIcon />
              {homeDashboard.resilienceTrend}
            </span>
          }
          value={
            <>
              {homeDashboard.resilienceScore}
              <span className="text-base font-normal text-muted">/100</span>
            </>
          }
          label="Career Resilience Index"
          labelHelp="Your overall ability to adapt as AI reshapes your field — based on skills, experience, demand, and learning agility. Higher scores mean more career options and lower risk."
        />
        <StatCard
          icon={<span className="flex h-8 w-8 items-center justify-center"><WarningIcon /></span>}
          topRight={
            <button
              type="button"
              aria-label="More options"
              className="text-muted transition hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          }
          value={homeDashboard.aiExposureLabel}
          label="AI Exposure Level"
          labelHelp="How much of your current role could be automated or AI-assisted. Helps you spot where to upskill, pivot, or double down on human-led work."
        />
      </div>

      <Card padding="md" className="border border-white/8 bg-navy-card shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recommended Career Paths</h2>
          <SectionLink to={xrayTo} label="View All" />
        </div>
        <div className="space-y-5">
          {homeDashboard.careerPaths.map((path) => (
            <CareerPathRow key={path.title} {...path} />
          ))}
        </div>
      </Card>

      <Card padding="md" className="border border-white/8 bg-navy-card shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">AI Career Radar</h2>
          <SectionLink to="/upgrade" label="View Radar" />
        </div>
        <div className="space-y-3.5">
          {homeDashboard.radarItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", item.dotColor)} />
                <span className="truncate text-sm text-white">{item.label}</span>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-400">
                {item.growth}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          {homeDashboard.newSignalsCount} new signals detected this week
        </p>
      </Card>

      <div className="space-y-3 pt-1">
        <PrimaryButtonLink to="/scan" fullWidth className="flex items-center justify-center gap-2">
          <ScanCornersIcon />
          Start New Scan
        </PrimaryButtonLink>

        <div className="grid grid-cols-2 gap-3">
          <PrimaryButtonLink to={xrayTo} fullWidth className="flex items-center justify-center gap-2">
            <SparkleIcon />
            Career X-Ray
          </PrimaryButtonLink>
          <PrimaryButtonLink to="/upgrade" fullWidth className="flex items-center justify-center gap-2">
            <RadarIcon />
            View Radar
          </PrimaryButtonLink>
        </div>
      </div>

      <button
        type="button"
        aria-label="Help"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-navy-card text-muted transition hover:text-white ft-focus-ring"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.2 1.8c0 1.8-2.2 2-2.2 3.7" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );
}
