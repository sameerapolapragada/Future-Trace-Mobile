import { Link, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { getRoleIntelligenceReport, roleTitleToSlug } from "../data/mockData";
import { RequireCareerXRay } from "../lib/RequireCareerXRay";
import { cn } from "../lib/cn";
import type { RoleSkillDifficulty } from "../types";

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

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-accent-soft">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

function difficultyTone(difficulty: RoleSkillDifficulty) {
  if (difficulty === "Hard") return "bg-red-500/15 text-red-400";
  if (difficulty === "Medium") return "bg-amber-500/15 text-amber-400";
  return "bg-emerald-500/15 text-emerald-400";
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  tone: "purple" | "green" | "blue";
}) {
  const tones = {
    purple: "border-accent-purple/25 bg-accent-purple/10",
    green: "border-emerald-500/25 bg-emerald-500/10",
    blue: "border-accent/25 bg-accent/10",
  };

  return (
    <div className={cn("flex-1 rounded-xl border p-3", tones[tone])}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
        <span className="text-muted">{icon}</span>
      </div>
      <p className="text-xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{sublabel}</p>
    </div>
  );
}

export default function RoleIntelligencePage() {
  const navigate = useNavigate();
  const { roleSlug } = useParams<{ roleSlug: string }>();
  const report = roleSlug ? getRoleIntelligenceReport(roleSlug) : undefined;

  return (
    <RequireCareerXRay>
      {!report ? (
        <div className="py-8 text-center">
          <p className="text-muted">Role report not found.</p>
          <Link to="/xray" className="mt-4 inline-block text-sm text-accent">
            Back to Career X-Ray
          </Link>
        </div>
      ) : (
        <RoleIntelligenceContent navigate={navigate} report={report} />
      )}
    </RequireCareerXRay>
  );
}

function RoleIntelligenceContent({
  navigate,
  report,
}: {
  navigate: ReturnType<typeof useNavigate>;
  report: NonNullable<ReturnType<typeof getRoleIntelligenceReport>>;
}) {
  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-start gap-2">
        <BackButton onClick={() => navigate("/xray")} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight text-white">{report.roleTitle}</h1>
          <p className="text-xs text-muted">Role Intelligence Report</p>
        </div>
        <button
          type="button"
          aria-label="Expand report"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:text-white ft-focus-ring"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2">
        <SummaryCard
          label="Match"
          value={`${report.matchScore}%`}
          sublabel={report.matchLabel}
          tone="purple"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          }
        />
        <SummaryCard
          label="Longevity"
          value={report.longevity}
          sublabel={report.longevityLabel}
          tone="green"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <SummaryCard
          label="Resilience"
          value={String(report.resilienceScore)}
          sublabel={report.resilienceLabel}
          tone="blue"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4z" />
            </svg>
          }
        />
      </div>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" strokeLinecap="round" />
            </svg>
          }
          title="Why this role fits you"
        />
        <p className="text-sm leading-relaxed text-muted">{report.whyItFits}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 12a8 8 0 0 1 8-8V4l4 4-4 4V8a4 4 0 1 0 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="Transferable Skills"
        />
        <div className="space-y-2">
          {report.transferableSkills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5"
            >
              <span className="text-emerald-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm text-white">{skill}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
            </svg>
          }
          title="Missing Skills"
        />
        <div className="space-y-2">
          {report.missingSkills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5"
            >
              <span className="text-sm text-white">{skill.name}</span>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", difficultyTone(skill.difficulty))}>
                {skill.difficulty}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Estimated time to fill: {report.missingSkillsTimeEstimate}
        </p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2z" />
            </svg>
          }
          title="Emerging Skills"
        />
        <p className="mb-3 text-xs text-muted">Skills gaining momentum in this role:</p>
        <div className="space-y-2">
          {report.emergingSkills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2.5"
            >
              <span className="text-sm text-white">{skill.name}</span>
              <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-soft">
                {skill.momentum}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
            </svg>
          }
          title="Salary Outlook"
        />
        <p className="text-2xl font-bold text-white">{report.salary.range}</p>
        <div className="mt-3 space-y-1 text-xs text-muted">
          <p>Entry Level: {report.salary.entry}</p>
          <p>Senior Level: {report.salary.senior}</p>
        </div>
        <p className="mt-3 text-xs font-medium text-emerald-400">{report.salary.localMatchNote}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-accent-soft">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold text-white">Demand Outlook</h2>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            {report.demand.cagr}
          </span>
        </div>
        <p className="text-base font-bold text-white">{report.demand.label}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{report.demand.description}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 12h4l2-7 4 14 2-7h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="Market Trend Signals"
        />
        <ul className="space-y-2">
          {report.marketSignals.map((signal) => (
            <li key={signal} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {signal}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/8 bg-navy-card p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 3v12M18 9v6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" />
            </svg>
          }
          title="Adjacent Future Roles"
        />
        <div className="space-y-2">
          {report.adjacentRoles.map((role) => (
            <Link
              key={role}
              to={`/xray/role/${roleTitleToSlug(role)}`}
              className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/10 px-3 py-2.5 transition hover:border-accent/40 ft-focus-ring"
            >
              <span className="text-sm text-white">{role}</span>
              <span className="text-xs text-accent">View &gt;</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="space-y-3 pt-1">
        <PrimaryButton
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          Track This Role
        </PrimaryButton>
        <Link
          to="/upgrade"
          className="flex items-center justify-center gap-2 text-sm text-muted transition hover:text-white ft-focus-ring"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 12 18 8" strokeLinecap="round" />
          </svg>
          Start AI Career Radar
        </Link>
      </div>
    </div>
  );
}
