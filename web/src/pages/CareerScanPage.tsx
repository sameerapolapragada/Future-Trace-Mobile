import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { UPGRADE_SCANS_EXHAUSTED_PATH } from "../lib/entitlementsService";
import { createCareerScan, type ScanFormInput } from "../lib/scanService";
import { inferTargetRole } from "../lib/targetRole";
import { cn } from "../lib/cn";

const workPreferences = ["Technical", "Business", "Hybrid"] as const;
type WorkPreference = (typeof workPreferences)[number];

const inputClass =
  "w-full rounded-2xl border border-white/8 bg-navy-elevated px-4 py-3.5 text-sm text-white outline-none placeholder:text-muted/60 focus:border-accent/40 ft-focus-ring";

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

    try {
      const scan = await createCareerScan(user.id, input);
      navigate("/scan-loading", { state: { scanId: scan.id }, replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not start scan");
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
        <h1 className="text-xl font-bold tracking-tight text-white">Career Scan</h1>
        <p className="text-sm leading-relaxed text-muted">
          Free users can run 1 scan per week. Upgrade to AI Career Radar for unlimited scans and
          Career X-Rays.
        </p>
        <PrimaryButton fullWidth onClick={() => navigate(UPGRADE_SCANS_EXHAUSTED_PATH)}>
          Upgrade to AI Career Radar — $9.99/month
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
        <p className="mt-2 text-xs text-muted">Free scan · results in under 60 seconds</p>
      </header>

      {[
        { label: "Current Role", value: currentRole, set: setCurrentRole, placeholder: "e.g., Salesforce Business Analyst" },
        { label: "Target Role", value: targetRole, set: setTargetRole, placeholder: "e.g., AI/ML Engineer" },
        { label: "Industry", value: industry, set: setIndustry, placeholder: "e.g., Technology" },
      ].map(({ label, value, set, placeholder }) => (
        <label key={label} className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
          <input
            type="text"
            required={label !== "Industry"}
            value={value}
            onChange={(e) => set(e.target.value)}
            className={inputClass}
            placeholder={placeholder}
          />
        </label>
      ))}

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Years Experience</span>
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
        <span className="mb-1.5 block text-xs font-medium text-muted">Skills</span>
        <textarea
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Business analysis, Salesforce"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Tools</span>
        <textarea
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Salesforce, Jira"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Career Goal</span>
        <textarea
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          rows={2}
          className={cn(inputClass, "resize-none")}
          placeholder="e.g., Transition into AI/ML"
        />
      </label>

      <fieldset>
        <span className="mb-1.5 block text-xs font-medium text-muted">Work Preference</span>
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
