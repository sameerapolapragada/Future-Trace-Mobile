import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { useEntitlements } from "../lib/entitlements";
import { saveScanSession } from "../lib/scanSession";
import { cn } from "../lib/cn";

const workPreferences = ["Technical", "Business", "Hybrid"] as const;
type WorkPreference = (typeof workPreferences)[number];

const inputClass =
  "w-full rounded-2xl border border-white/8 bg-navy-elevated px-4 py-3.5 text-sm text-white outline-none placeholder:text-muted/60 focus:border-accent/40 ft-focus-ring";

function FieldLabel({
  icon,
  iconClass,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", iconClass)}>
        {icon}
      </span>
      {children}
    </span>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21V5a1 1 0 0 1 1-1h5v17M14 21V9h5a1 1 0 0 1 1 1v11M9 9h1M9 13h1M9 17h1M16 13h1M16 17h1" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="15" r="4" />
      <path d="m11.5 11.5 8-8M16 5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WorkPreferenceHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white">
        Work Preference
        <button
          type="button"
          aria-label="What do the work preference options mean?"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 text-[9px] font-bold text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
        >
          ?
        </button>
      </legend>
      {open ? (
        <ul className="mb-2 space-y-1.5 text-[10px] leading-relaxed text-muted">
          <li>
            <span className="font-semibold text-white">Technical</span> — Hands-on work building,
            configuring, or running systems, tools, and workflows.
          </li>
          <li>
            <span className="font-semibold text-white">Business</span> — Strategy, operations,
            client-facing, or leadership work with less day-to-day technical execution.
          </li>
          <li>
            <span className="font-semibold text-white">Hybrid</span> — A mix of both, such as
            translating business goals into technical solutions.
          </li>
        </ul>
      ) : null}
    </>
  );
}

export default function CareerScanPage() {
  const navigate = useNavigate();
  const { entitlements, loading, useScan } = useEntitlements();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [toolsUsed, setToolsUsed] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [workPreference, setWorkPreference] = useState<WorkPreference>("Hybrid");

  const noScansRemaining = !loading && entitlements.freeScansRemaining <= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (noScansRemaining || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await useScan();
      saveScanSession({
        jobTitle: jobTitle.trim(),
        industry: industry.trim(),
        yearsExperience: yearsExperience.trim(),
        currentSkills: currentSkills.trim(),
        toolsUsed: toolsUsed.trim(),
        careerGoal: careerGoal.trim(),
        workPreference,
      });
      navigate("/scan-loading");
    } catch {
      setSubmitError("No free scans remaining. Unlock Career X-Ray or AI Career Radar to continue.");
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

  if (noScansRemaining) {
    return (
      <div className="space-y-5 pb-4 text-center">
        <header className="pb-1">
          <h1 className="text-xl font-bold tracking-tight text-white">Career Scan</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You&apos;ve used all your free scans. Unlock Career X-Ray or subscribe to AI Career Radar for
            more insights.
          </p>
        </header>
        <PrimaryButton fullWidth onClick={() => navigate("/career-xray")}>
          View upgrade options
        </PrimaryButton>
        <Link to="/home" className="block text-sm text-accent transition hover:text-accent-soft">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-4">
      <header className="pb-1 text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">Career Scan</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ClockIcon />
          This takes less than 60 seconds
        </p>
      </header>

      <label className="block">
        <FieldLabel icon={<BriefcaseIcon />} iconClass="text-accent">
          Current Job Title
        </FieldLabel>
        <input
          type="text"
          required
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className={inputClass}
          placeholder="e.g., Senior Software Engineer"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<BuildingIcon />} iconClass="text-accent-purple">
          Industry
        </FieldLabel>
        <input
          type="text"
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={inputClass}
          placeholder="e.g., Technology, Healthcare, Finance"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<ClockIcon />} iconClass="text-cyan-400">
          Years of Experience
        </FieldLabel>
        <input
          type="number"
          required
          min={0}
          max={50}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className={inputClass}
          placeholder="e.g., 5"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<SkillsIcon />} iconClass="text-emerald-400">
          Current Skills
        </FieldLabel>
        <textarea
          required
          value={currentSkills}
          onChange={(e) => setCurrentSkills(e.target.value)}
          rows={3}
          className={cn(inputClass, "min-h-[88px] resize-none")}
          placeholder="e.g., Python, Machine Learning, Team Leadership"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<KeyIcon />} iconClass="text-amber-400">
          Tools Used
        </FieldLabel>
        <textarea
          required
          value={toolsUsed}
          onChange={(e) => setToolsUsed(e.target.value)}
          rows={3}
          className={cn(inputClass, "min-h-[88px] resize-none")}
          placeholder="e.g., VS Code, Git, Docker, AWS"
        />
      </label>

      <label className="block">
        <FieldLabel icon={<TargetIcon />} iconClass="text-pink-400">
          Career Goal
        </FieldLabel>
        <textarea
          required
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          rows={3}
          className={cn(inputClass, "min-h-[88px] resize-none")}
          placeholder="e.g., Transition into AI/ML leadership role"
        />
      </label>

      <fieldset>
        <WorkPreferenceHelp />
        <div className="flex rounded-2xl border border-white/8 bg-navy-elevated p-1">
          {workPreferences.map((option) => {
            const selected = workPreference === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setWorkPreference(option)}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2.5 text-sm font-medium transition ft-focus-ring",
                  selected
                    ? "border border-cyan-400/50 bg-cyan-500/15 text-white"
                    : "border border-transparent text-muted hover:text-white"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <PrimaryButton type="submit" fullWidth className="mt-2" disabled={submitting}>
        {submitting ? "Starting scan…" : "Generate My Career Scan"}
      </PrimaryButton>
      {entitlements.freeScansRemaining > 0 ? (
        <p className="text-center text-xs text-muted">
          {entitlements.freeScansRemaining} free scan
          {entitlements.freeScansRemaining === 1 ? "" : "s"} remaining
        </p>
      ) : null}
      {submitError ? (
        <p className="text-center text-xs text-red-400" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
