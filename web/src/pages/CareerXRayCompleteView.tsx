import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrimaryButtonLink } from "../design-system";
import { xrayCompleteReport } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";
import type { XRayGapLevel, XRayImpactLevel } from "../types";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accent-soft ft-focus-ring"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-l-2 border-accent pl-2.5 text-xs font-bold uppercase tracking-widest text-white">
      {children}
    </h2>
  );
}

function KeyFindingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/25 bg-navy-card p-4 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-accent/20 px-3 py-2.5 last:border-b-0">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="flex items-center gap-1">
          <span className="bg-gradient-to-r from-accent-gold to-accent-purple bg-clip-text text-xs font-semibold text-transparent">
            {label}
          </span>
          {help ? (
            <button
              type="button"
              aria-label={`What is ${label}?`}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 text-[9px] font-bold text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
            >
              ?
            </button>
          ) : null}
        </div>
        <span className="text-right text-xs font-semibold text-white">{children}</span>
      </div>
      {open && help ? (
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{help}</p>
      ) : null}
    </div>
  );
}

function gapTone(gap: XRayGapLevel) {
  if (gap === "Small Gap") return "text-accent";
  if (gap === "Moderate Gap") return "text-accent-gold";
  return "text-danger";
}

function impactTone(impact: XRayImpactLevel) {
  return impact === "High Impact" ? "text-accent-purple" : "text-accent";
}

const SKILL_GAP_COLUMNS = [
  {
    id: "skill",
    label: "Skill",
    help: "A capability employers expect for your target roles, measured against your current profile and experience.",
  },
  {
    id: "gap",
    label: "Gap",
    help: "How far you are from the skill level the market expects — rated Small, Moderate, or Large.",
  },
  {
    id: "impact",
    label: "Impact",
    help: "How much closing this gap would improve your competitiveness for top transition roles.",
  },
  {
    id: "benefit",
    label: "Benefit",
    help: "Estimated match score increase if you close this gap and reach the target skill level.",
    align: "right" as const,
  },
];

function SkillGapTableHeader() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-2 border-b border-accent/20 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-accent">
        {SKILL_GAP_COLUMNS.map((column) => (
          <div
            key={column.id}
            className={cn(
              "flex items-center gap-0.5",
              column.align === "right" && "justify-end"
            )}
          >
            <span>{column.label}</span>
            <button
              type="button"
              aria-label={`What is ${column.label}?`}
              aria-expanded={openId === column.id}
              onClick={() => setOpenId((prev) => (prev === column.id ? null : column.id))}
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[8px] font-bold normal-case text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
            >
              ?
            </button>
          </div>
        ))}
      </div>
      {openId ? (
        <p className="border-b border-accent/20 px-3 py-2 text-[10px] leading-relaxed text-muted">
          {SKILL_GAP_COLUMNS.find((column) => column.id === openId)?.help}
        </p>
      ) : null}
    </>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 2 21h20L12 3z" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function outlineActionStyles(tone: "accent" | "purple") {
  return tone === "accent"
    ? "border-accent/35 bg-accent/8 text-accent hover:bg-accent/12"
    : "border-accent-purple/35 bg-accent-purple/8 text-accent-gold hover:bg-accent-purple/12";
}

function OutlineActionLink({
  to,
  icon,
  label,
  tone,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  tone: "accent" | "purple";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition ft-focus-ring",
        outlineActionStyles(tone)
      )}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      <ChevronRight />
    </Link>
  );
}

function OutlineActionButton({
  icon,
  label,
  tone,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "accent" | "purple";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition ft-focus-ring",
        outlineActionStyles(tone),
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      <ChevronRight />
    </button>
  );
}

export default function CareerXRayCompleteView() {
  const navigate = useNavigate();
  const { entitlements } = useEntitlements();
  const report = xrayCompleteReport;
  const radarTo = entitlements.hasRadar ? "/radar" : "/upgrade";

  return (
    <div className="space-y-5 pb-4">
      <div className="space-y-3">
        <BackButton onClick={() => navigate("/home")} />
        <h1 className="text-lg font-bold uppercase tracking-wide text-white">Career X-Ray Complete</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-accent/25 bg-navy-card/80">
        <SummaryRow label="Current Role">{report.currentRole}</SummaryRow>
        <SummaryRow
          label="Future Readiness Score"
          help="How prepared you are for AI-driven changes in your field — based on skills, adaptability, market demand, and learning momentum. Higher scores mean more options and lower career risk."
        >
          <span className="text-accent">
            {report.futureReadinessScore}
            <span className="text-muted">/100</span>
          </span>
        </SummaryRow>
        <SummaryRow
          label="Market Outlook"
          help="Where demand for roles like yours is heading over the next 12–24 months — factoring in hiring trends, AI disruption, and growth in adjacent career paths."
        >
          <span className="text-success">{report.marketOutlook}</span>
        </SummaryRow>
        <SummaryRow label="Top Career Opportunity">
          <span className="text-accent-purple">{report.topCareerOpportunity}</span>
        </SummaryRow>
      </div>

      <section className="space-y-3">
        <SectionTitle>Key Findings</SectionTitle>

        <KeyFindingCard className="bg-accent-purple/15">
          <div className="flex items-start gap-3">
            <span className="text-accent-purple">
              <TargetIcon />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-accent-purple">
                Strongest Opportunity
              </p>
              <p className="mt-1 text-sm font-bold text-white">{report.strongestOpportunity.role}</p>
              <p className="mt-0.5 text-xs font-semibold text-accent-purple">
                {report.strongestOpportunity.matchScore}% Match
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {report.strongestOpportunity.whyLines[0]}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {report.strongestOpportunity.whyLines[1]}
              </p>
            </div>
          </div>
        </KeyFindingCard>

        <KeyFindingCard className="bg-danger/15">
          <div className="flex items-start gap-3">
            <span className="text-danger">
              <WarningIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-danger">Biggest Skill Gap</p>
              <p className="mt-1 text-sm font-bold text-white">{report.biggestSkillGap.skill}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md bg-accent-gold/15 px-2 py-0.5 text-[10px] font-semibold text-accent-gold">
                  {report.biggestSkillGap.gapLabel}
                </span>
                <span className="rounded-md bg-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                  {report.biggestSkillGap.impactLabel}
                </span>
              </div>
            </div>
          </div>
        </KeyFindingCard>

        <KeyFindingCard className="bg-accent/15">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent">Recommended Action</p>
            <p className="mt-1 text-sm font-bold text-white">{report.recommendedAction.action}</p>
            <p className="mt-1 text-xs font-medium text-success">
              Expected Impact: {report.recommendedAction.expectedImpact}
            </p>
          </div>
        </KeyFindingCard>
      </section>

      <section className="space-y-3">
        <SectionTitle>Skill Gap Analysis</SectionTitle>

        <div className="overflow-hidden rounded-xl border border-accent/25 bg-navy-card/80">
          <SkillGapTableHeader />
          {report.skillGapAnalysis.map((row) => (
            <div
              key={row.skill}
              className="grid grid-cols-4 gap-2 border-b border-white/6 px-3 py-2.5 text-[11px] last:border-b-0"
            >
              <span className="font-medium text-white">{row.skill}</span>
              <span className={cn("font-semibold", gapTone(row.gap))}>{row.gap}</span>
              <span className={cn("font-semibold", impactTone(row.impact))}>{row.impact}</span>
              <span className="text-right font-semibold text-success">{row.benefit}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-accent/90">• {report.skillGapFooterNote}</p>
      </section>

      <div className="space-y-3 pt-1">
        <PrimaryButtonLink
          to="/xray/opportunities"
          fullWidth
          className="flex items-center justify-between gap-2 px-4"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View Career Opportunities
          </span>
          <ChevronRight />
        </PrimaryButtonLink>

        <OutlineActionLink
          to={radarTo}
          label={entitlements.hasRadar ? "Open AI Career Radar" : "Activate AI Career Radar"}
          tone="purple"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 12 18 8" strokeLinecap="round" />
            </svg>
          }
        />

        <OutlineActionButton
          tone="purple"
          disabled
          label="Transformation Path (Coming Soon)"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 3v12M18 9v6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" />
              <path d="M6 9h8a4 4 0 0 1 4 4" strokeLinecap="round" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
