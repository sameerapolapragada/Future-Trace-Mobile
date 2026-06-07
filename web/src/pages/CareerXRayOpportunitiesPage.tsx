import { Link, Navigate, useNavigate } from "react-router-dom";
import { roleTitleToSlug, xrayInsights } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";
import type { XRayTransitionRole } from "../types";

const MATCH_BADGE_STYLES = [
  "bg-emerald-500/15 text-emerald-400",
  "bg-accent-purple/20 text-accent-gold",
  "bg-accent/15 text-accent-soft",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
] as const;

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/8 hover:text-white ft-focus-ring"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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

function TransitionRoleCard({
  role,
  rank,
  badgeClass,
}: {
  role: XRayTransitionRole;
  rank: number;
  badgeClass: string;
}) {
  const skillsCount = role.missingSkills.length;
  const rolePath = `/xray/role/${roleTitleToSlug(role.title)}`;

  return (
    <article className="rounded-2xl border border-white/8 bg-navy-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">#{rank}</p>
          <h3 className="mt-0.5 text-base font-bold text-white">{role.title}</h3>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", badgeClass)}>
          {role.matchScore}% Match
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">{role.whyItFits}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
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

      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
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
    </article>
  );
}

export default function CareerXRayOpportunitiesPage() {
  const navigate = useNavigate();
  const { entitlements } = useEntitlements();

  if (!entitlements.hasCareerXRay) {
    return <Navigate to="/career-xray" replace />;
  }

  return (
    <div className="space-y-5 pb-2">
      <div className="flex items-start gap-2">
        <BackButton onClick={() => navigate("/xray")} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white">Career Opportunities</h1>
          <p className="mt-0.5 text-xs text-muted">Transition roles ranked by match score</p>
        </div>
      </div>

      <div className="space-y-3">
        {xrayInsights.transitionRoles.map((role, index) => (
          <TransitionRoleCard
            key={role.title}
            role={role}
            rank={index + 1}
            badgeClass={MATCH_BADGE_STYLES[index] ?? MATCH_BADGE_STYLES[0]}
          />
        ))}
      </div>
    </div>
  );
}
