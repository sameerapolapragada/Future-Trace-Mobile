import { Link } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { roleTitleToSlug } from "../lib/xrayDataService";
import { cn } from "../lib/cn";
import type { CareerOpportunityRole, TransitionDifficulty } from "../types";

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

function MatchScoreRing({ score }: { score: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex shrink-0 flex-col items-center">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#00b4ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
        />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central" className="fill-white text-[8px] font-bold">
          {score}%
        </text>
      </svg>
      <span className="mt-0.5 text-[7px] font-semibold text-accent">Match Score</span>
    </div>
  );
}

function difficultyColor(difficulty: TransitionDifficulty) {
  if (difficulty === "Low") return "text-success";
  if (difficulty === "Medium") return "text-danger";
  return "text-danger";
}

function RoleIcon({ title }: { title: string }) {
  const configs: Record<string, { bg: string; glow: string; icon: React.ReactNode }> = {
    "AI Operations Analyst": {
      bg: "bg-success/15 border-success/30",
      glow: "shadow-success/20",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
        </svg>
      ),
    },
    "Model Trust Auditor": {
      bg: "bg-danger/15 border-danger/30",
      glow: "shadow-danger/20",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4500" strokeWidth="1.6">
          <path d="M12 3 3 10v11h18V10L12 3z" strokeLinejoin="round" />
          <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    "Salesforce Architect": {
      bg: "bg-accent/15 border-accent/30",
      glow: "shadow-accent/20",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="1.6">
          <path d="M4 16l8-10 8 10" strokeLinejoin="round" />
          <path d="M4 20h16" strokeLinecap="round" />
        </svg>
      ),
    },
    "AI Governance Analyst": {
      bg: "bg-accent-purple/15 border-accent-purple/30",
      glow: "shadow-accent-purple/20",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      ),
    },
    "Product Operations Manager": {
      bg: "bg-accent-gold/10 border-accent-gold/25",
      glow: "shadow-accent-gold/15",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="1.6">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
  };

  const config = configs[title] ?? {
    bg: "bg-accent/15 border-accent/30",
    glow: "shadow-accent/20",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-lg",
        config.bg,
        config.glow
      )}
    >
      {config.icon}
    </div>
  );
}

function MetricColumn({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[7px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-0.5 text-[10px] font-bold", valueClass ?? "text-white")}>{value}</p>
    </div>
  );
}

function OpportunityCard({ role }: { role: CareerOpportunityRole }) {
  const rolePath = `/xray/role/${roleTitleToSlug(role.title)}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-card/90 p-4">
      <div className="flex items-start gap-3">
        <RoleIcon title={role.title} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">{role.title}</p>
        </div>
        <MatchScoreRing score={role.matchScore} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-white/6 py-3">
        <MetricColumn
          label="Difficulty"
          value={role.difficulty}
          valueClass={difficultyColor(role.difficulty)}
        />
        <MetricColumn label="Transition Time" value={role.transitionTime} valueClass="text-accent" />
        <MetricColumn label="Salary Range" value={role.salaryRange} valueClass="text-success" />
      </div>

      <Link to={rolePath} className="mt-3 flex items-start justify-between gap-2 ft-focus-ring">
        <div className="min-w-0">
          <p className="text-[8px] font-bold uppercase tracking-wide text-accent">Why This Fits</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">{role.whyFits}</p>
        </div>
        <span className="mt-2 shrink-0 text-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>

      {role.missingSkills.length > 0 ? (
        <div className="mt-3">
          <p className="text-[8px] font-bold uppercase tracking-wide text-accent">Top Missing Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[9px] font-medium text-white/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function formatXrayIdLabel(id: string): string {
  const compact = id.replace(/-/g, "").toUpperCase();
  return `XR-${compact.slice(0, 5)}`;
}

type CareerOpportunitiesViewProps = {
  roles: CareerOpportunityRole[];
  xrayIdLabel: string;
  onBack: () => void;
};

export function CareerOpportunitiesView({ roles, xrayIdLabel, onBack }: CareerOpportunitiesViewProps) {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <BackButton onClick={onBack} />
        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-muted">
          X-RAY ID: {xrayIdLabel}
        </span>
      </div>

      <div>
        <h1 className="text-sm font-bold uppercase tracking-widest text-white">
          Recommended Career Opportunities
        </h1>
        <p className="mt-1 text-xs text-muted">Based on your current role, skills, and market signals.</p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <OpportunityCard key={role.title} role={role} />
        ))}
      </div>

      <p className="flex items-start gap-2 text-[9px] leading-relaxed text-muted">
        <span className="mt-0.5 shrink-0 text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-left">
          Match scores are based on your profile and real-time market data. Roles and scores may change as you
          learn and grow.
        </span>
      </p>

      <PrimaryButton type="button" disabled fullWidth className="text-[10px] font-bold uppercase tracking-wide">
        Career Transition Paths (Coming Soon)
      </PrimaryButton>
    </div>
  );
}
