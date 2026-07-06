import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { UPGRADE_SCANS_EXHAUSTED_PATH } from "../lib/entitlementsService";
import { type ScanFormInput } from "../lib/scanService";
import { inferTargetRole } from "../lib/targetRole";
import { runRoleMatch } from "../lib/roleMatchService";
import { cn } from "../lib/cn";
import type { Entitlements } from "../types";

const workPreferences = ["Technical", "Business", "Hybrid"] as const;
type WorkPreference = (typeof workPreferences)[number];

const WORK_PREFERENCE_HELP = [
  {
    option: "Technical",
    description: "Hands-on work — building, coding, data, engineering, or deep technical tool use.",
  },
  {
    option: "Business",
    description: "Strategy and people-facing work — analysis, operations, consulting, product, or management.",
  },
  {
    option: "Hybrid",
    description: "A mix of both — you regularly work across technical delivery and business responsibilities.",
  },
] as const;

const inputClass =
  "w-full rounded-2xl border border-white/8 bg-navy-elevated px-4 py-3.5 text-sm text-white outline-none placeholder:text-muted/60 focus:border-accent/40 ft-focus-ring";

function FieldLabel({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted", className)}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
        {icon}
      </span>
      {children}
    </span>
  );
}

function CurrentRoleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3498DB" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetRoleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="#4ADE80" stroke="none" />
    </svg>
  );
}

function IndustryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
      <path d="M3 21h18" strokeLinecap="round" />
      <path d="M5 21V7l7-4 7 4v14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function YearsExperienceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2">
      <path
        d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.8 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8L12 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CareerGoalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 22v-7" strokeLinecap="round" />
    </svg>
  );
}

function WorkPreferenceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
      <path d="M12 3v18" strokeLinecap="round" />
      <path d="M3 8h18" strokeLinecap="round" />
      <path d="M3 16h18" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" fill="#8B5CF6" stroke="none" />
      <circle cx="16" cy="16" r="2" fill="#8B5CF6" stroke="none" />
    </svg>
  );
}

function WorkPreferenceHelp() {
  const [open, setOpen] = useState(false);
  const panelId = "work-preference-help";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="What do Technical, Business, and Hybrid mean?"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-[11px] font-semibold text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
      >
        ?
      </button>

      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className="absolute right-0 top-full z-10 mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-navy-card p-3 text-left shadow-lg"
        >
          <p className="mb-2 text-[11px] font-semibold text-white">Work preference options</p>
          <ul className="space-y-2">
            {WORK_PREFERENCE_HELP.map(({ option, description }) => (
              <li key={option}>
                <p className="text-[11px] font-medium text-accent-soft">{option}</p>
                <p className="text-[11px] leading-relaxed text-muted">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function weeklyScanLabel(entitlements: Entitlements): string {
  const usage = entitlements.monthlyUsage;
  if (usage) {
    const remaining = Math.max(0, usage.careerScansLimit - usage.careerScansUsed);
    return `${remaining} of ${usage.careerScansLimit} scans left this month`;
  }
  const remaining = entitlements.scansRemainingThisWeek ?? 0;
  if (remaining === 1) return "1 free scan left this week";
  if (remaining === 0) return "0 free scans left this week";
  return `${remaining} free scans left this week`;
}

function WeeklyScanBadge({ entitlements }: { entitlements: Entitlements }) {
  const remaining = entitlements.scansRemainingThisWeek ?? 0;
  const hasQuota = remaining > 0;

  return (
    <span
      className={cn(
        "mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        hasQuota
          ? "border-accent/30 bg-accent/10 text-sky-300"
          : "border-white/10 bg-white/5 text-muted"
      )}
    >
      {weeklyScanLabel(entitlements)}
    </span>
  );
}

export default function CareerScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entitlements, loading } = useEntitlements();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [tools, setTools] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [workPreference, setWorkPreference] = useState<WorkPreference>("Hybrid");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || submitting || !entitlements.canRunScan) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const input: ScanFormInput = {
        currentRole,
        targetRole: targetRole || inferTargetRole(careerGoal, currentRole),
        industry,
        yearsExperience,
        skills,
        tools,
        careerGoal,
        workPreference,
      };

      const snapshot = await runRoleMatch(user.id, {
        originalRoleInput: currentRole.trim(),
        industry: industry.trim() || undefined,
        yearsExperience: parseInt(yearsExperience, 10) || 0,
        skills: skills.trim() || undefined,
        tools: tools.trim() || undefined,
      });

      if (snapshot.matchStatus === "matched") {
        navigate("/scan/review-role", { state: { form: input, roleMatch: snapshot } });
      } else if (snapshot.matchStatus === "partial_match") {
        navigate("/scan/role-confirm", { state: { form: input, roleMatch: snapshot } });
      } else {
        navigate("/scan/role-needs-info", { state: { form: input, roleMatch: snapshot } });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!entitlements.canRunScan) {
    return (
      <div className="space-y-5 pb-4 text-center">
        <header>
          <h1 className="text-xl font-bold tracking-tight text-white">Career Scan</h1>
          <WeeklyScanBadge entitlements={entitlements} />
        </header>
        <p className="text-sm leading-relaxed text-muted">
          {entitlements.hasRadar
            ? "You've used all 10 career scans for this month."
            : "Free users can run 1 scan per week. Upgrade to AI Career Transition for 10 career scans per month."}
        </p>
        <PrimaryButton
          fullWidth
          onClick={() =>
            navigate(
              entitlements.hasRadar
                ? "/upgrade?product=transition&reason=monthly-scans"
                : UPGRADE_SCANS_EXHAUSTED_PATH
            )
          }
        >
          {entitlements.hasRadar ? "View limit details" : "Start AI Career Transition — $9.99/month"}
        </PrimaryButton>
        <Link to="/home" className="block text-sm text-accent">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pb-4">
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">Career Scan</h1>
        <p className="mt-2 text-xs text-muted">Results in under 60 seconds</p>
        <WeeklyScanBadge entitlements={entitlements} />
      </header>

      {[
        {
          label: "Current Role",
          icon: <CurrentRoleIcon />,
          value: currentRole,
          set: setCurrentRole,
          placeholder: "e.g., Salesforce Business Analyst",
          required: true,
        },
        {
          label: "Target Role",
          icon: <TargetRoleIcon />,
          value: targetRole,
          set: setTargetRole,
          placeholder: "e.g., AI/ML Engineer",
          required: true,
        },
        {
          label: "Industry",
          icon: <IndustryIcon />,
          value: industry,
          set: setIndustry,
          placeholder: "e.g., Technology",
          required: false,
        },
      ].map(({ label, icon, value, set, placeholder, required }) => (
        <label key={label} className="block">
          <FieldLabel icon={icon}>{label}</FieldLabel>
          <input
            type="text"
            required={required}
            value={value}
            onChange={(e) => set(e.target.value)}
            className={inputClass}
            placeholder={placeholder}
          />
        </label>
      ))}

      <label className="block">
        <FieldLabel icon={<YearsExperienceIcon />}>Years Experience</FieldLabel>
        <input
          type="number"
          min={0}
          max={50}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className={inputClass}
          placeholder="e.g., 8"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<SkillsIcon />}>Skills</FieldLabel>
        <textarea
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Business analysis, Salesforce"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<ToolsIcon />}>Tools</FieldLabel>
        <textarea
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Salesforce, Jira"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<CareerGoalIcon />}>Career Goal</FieldLabel>
        <textarea
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Transition into AI/ML"
        />
      </label>

      <fieldset>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <FieldLabel icon={<WorkPreferenceIcon />} className="mb-0">
            Work Preference
          </FieldLabel>
          <WorkPreferenceHelp />
        </div>
        <div className="flex rounded-2xl border border-white/8 bg-navy-elevated p-1">
          {workPreferences.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setWorkPreference(option)}
              className={cn(
                "flex-1 rounded-xl px-2 py-2.5 text-sm font-medium transition ft-focus-ring",
                workPreference === option
                  ? "border border-cyan-400/50 bg-cyan-500/15 text-white"
                  : "text-muted hover:text-white"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <PrimaryButton type="submit" fullWidth disabled={submitting}>
        {submitting ? "Starting scan…" : "Generate My Career Scan"}
      </PrimaryButton>

      {submitError ? (
        <p className="text-center text-xs text-red-400" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
