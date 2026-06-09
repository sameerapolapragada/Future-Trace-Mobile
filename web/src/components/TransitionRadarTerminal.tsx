import { useState } from "react";
import { Link } from "react-router-dom";
import { roleTitleToSlug } from "../data/mockData";
import { cn } from "../lib/cn";
import type { TransitionRadarPreview, XRayTransitionRole } from "../types";

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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="14" width="3" height="6" rx="0.5" />
      <rect x="10" y="10" width="3" height="10" rx="0.5" />
      <rect x="16" y="6" width="3" height="14" rx="0.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h12M8 12h12M8 18h12" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function formatDifficulty(difficulty: XRayTransitionRole["difficulty"]) {
  if (difficulty === "Moderate") return "Medium";
  return difficulty;
}

function LockedPathRow({ path }: { path: TransitionRadarPreview["paths"][number] }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/6 bg-gradient-to-r px-3 py-2.5",
        path.colorClass
      )}
    >
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold", path.numberClass)}>
        {path.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90 blur-[4px] select-none">
          Senior Transition Role Title
        </p>
        <p className={cn("mt-0.5 text-xs font-semibold tabular-nums", path.salaryClass)}>{path.salary}</p>
      </div>
      <LockIcon className="shrink-0 text-white/50" />
    </div>
  );
}

function UnlockedPathRow({
  path,
  role,
  expanded,
  onToggle,
}: {
  path: TransitionRadarPreview["paths"][number];
  role: XRayTransitionRole;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rolePath = `/xray/role/${roleTitleToSlug(role.title)}`;
  const skillsCount = role.missingSkills.length;

  return (
    <div className="overflow-hidden rounded-xl border border-white/6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-3 bg-gradient-to-r px-3 py-2.5 text-left transition hover:brightness-110 ft-focus-ring",
          path.colorClass
        )}
      >
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold", path.numberClass)}>
          {path.rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{role.title}</p>
          <p className={cn("mt-0.5 text-xs font-semibold tabular-nums", path.salaryClass)}>
            {role.salary || path.salary}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-emerald-400">{role.matchScore}%</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("shrink-0 text-white/50 transition", expanded && "rotate-180")}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded ? (
        <div className="border-t border-white/6 bg-navy-card/90 px-3 py-3">
          <p className="text-[11px] leading-relaxed text-muted">{role.whyItFits}</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-muted">
                <SignalIcon />
                <span className="text-[10px]">Difficulty</span>
              </div>
              <p className="text-xs font-medium text-white">{formatDifficulty(role.difficulty)}</p>
            </div>
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-muted">
                <ClockIcon />
                <span className="text-[10px]">Time</span>
              </div>
              <p className="text-xs font-medium text-white">{role.transitionTime}</p>
            </div>
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-muted">
                <ListIcon />
                <span className="text-[10px]">Skills Gap</span>
              </div>
              <p className="text-xs font-medium text-white">{skillsCount} skills</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3">
            <Link
              to={rolePath}
              className="text-xs font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
            >
              View Role Intelligence
            </Link>
            <Link to={rolePath} className="text-xs text-muted transition hover:text-white ft-focus-ring">
              Tap for details &gt;
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type TransitionRadarTerminalProps = {
  preview: TransitionRadarPreview;
  locked?: boolean;
  roles?: XRayTransitionRole[];
  showHeader?: boolean;
};

export function TransitionRadarTerminal({
  preview,
  locked = false,
  roles = [],
  showHeader = true,
}: TransitionRadarTerminalProps) {
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-[#0d111c] p-4 shadow-lg shadow-orange-500/5">
      {showHeader ? (
        <div className="mb-4 rounded-xl border border-orange-500/30 bg-black/40 px-3 py-2">
          <p className="font-mono text-[11px] font-bold tracking-wide">
            <span className="text-orange-400">&gt;_</span>{" "}
            <span className="text-orange-400">CAREER</span>{" "}
            <span className="text-white">INTELLIGENCE TERMINAL</span>
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white">Your Transition Radar</h2>
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
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-white">
            Your 5 Immediate Transition Paths
          </h3>
          {locked ? (
            <span className="flex items-center gap-1 text-[9px] font-semibold uppercase text-orange-400">
              <LockIcon className="text-orange-400" />
              Blurred for you
            </span>
          ) : (
            <span className="text-[9px] font-semibold uppercase text-emerald-400">Unlocked</span>
          )}
        </div>

        <div className="space-y-2">
          {locked
            ? preview.paths.map((path) => <LockedPathRow key={path.rank} path={path} />)
            : preview.paths.map((path, index) => {
                const role = roles[index];
                if (!role) return <LockedPathRow key={path.rank} path={path} />;

                return (
                  <UnlockedPathRow
                    key={path.rank}
                    path={path}
                    role={role}
                    expanded={expandedRank === path.rank}
                    onToggle={() =>
                      setExpandedRank((current) => (current === path.rank ? null : path.rank))
                    }
                  />
                );
              })}
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
  );
}
