import { xrayCompleteReport, xrayInsights, roleTitleToSlug } from "../data/mockData";
import type {
  XRayCompleteReport,
  XRayGapLevel,
  XRayImpactLevel,
  XRayInsight,
  XRayTransitionRole,
} from "../types";
import { supabase } from "./supabaseClient";
import { loadScanSession, parseSkillList } from "./scanSession";

type GapLevelDb = "small_gap" | "moderate_gap" | "large_gap";
type ImpactLevelDb = "medium_impact" | "high_impact";
type DifficultyDb = "low" | "moderate" | "high";
type TrendDb = "rising" | "stable" | "declining";

type XrayTransitionRow = {
  rank: number;
  match_score: number;
  difficulty: DifficultyDb;
  transition_time_label: string;
  why_it_fits: string;
  trend: TrendDb;
  salary_display: string;
  occupation_roles: { title: string } | { title: string }[] | null;
};

type XraySkillGapRow = {
  skill_label: string;
  gap_level: GapLevelDb;
  impact_level: ImpactLevelDb;
  benefit_text: string;
  sort_order?: number;
};

function mapGapLevel(level: GapLevelDb): XRayGapLevel {
  if (level === "small_gap") return "Small Gap";
  if (level === "large_gap") return "Large Gap";
  return "Moderate Gap";
}

function mapImpactLevel(level: ImpactLevelDb): XRayImpactLevel {
  return level === "high_impact" ? "High Impact" : "Medium Impact";
}

function mapDifficulty(level: DifficultyDb): XRayTransitionRole["difficulty"] {
  if (level === "low") return "Low";
  if (level === "high") return "High";
  return "Moderate";
}

function getRoleTitle(row: XrayTransitionRow): string {
  if (!row.occupation_roles) return `Transition Role ${row.rank}`;
  return Array.isArray(row.occupation_roles)
    ? (row.occupation_roles[0]?.title ?? `Transition Role ${row.rank}`)
    : row.occupation_roles.title;
}

function personalizeWhyItFits(base: string, jobTitle: string, industry: string): string {
  if (!jobTitle) return base;
  const industryPhrase = industry ? ` in ${industry}` : "";
  return base.replace(/Your Salesforce expertise/i, `Your ${jobTitle} experience${industryPhrase}`);
}

function buildFromScanSession(session: NonNullable<ReturnType<typeof loadScanSession>>): {
  report: XRayCompleteReport;
  insights: XRayInsight;
} {
  const skills = parseSkillList(session.currentSkills);
  const tools = parseSkillList(session.toolsUsed);
  const strengths = [...new Set([...skills.slice(0, 3), ...tools.slice(0, 1)])].filter(Boolean);
  const baseReport = xrayCompleteReport;
  const baseInsights = xrayInsights;
  const topRole = baseInsights.transitionRoles[0];

  const transitionRoles = baseInsights.transitionRoles.map((role) => ({
    ...role,
    whyItFits: personalizeWhyItFits(role.whyItFits, session.jobTitle, session.industry),
  }));

  const report: XRayCompleteReport = {
    ...baseReport,
    currentRole: session.jobTitle,
    topCareerOpportunity: topRole?.title ?? baseReport.topCareerOpportunity,
    topRoleSlug: roleTitleToSlug(topRole?.title ?? baseReport.topCareerOpportunity),
    strongestOpportunity: {
      role: topRole?.title ?? baseReport.strongestOpportunity.role,
      matchScore: topRole?.matchScore ?? baseReport.strongestOpportunity.matchScore,
      whyLines: [
        personalizeWhyItFits(
          topRole?.whyItFits ?? baseReport.strongestOpportunity.whyLines[0],
          session.jobTitle,
          session.industry
        ),
        `Based on your background as ${session.jobTitle}${session.industry ? ` in ${session.industry}` : ""}, with a focus on ${session.careerGoal || "career growth"}.`,
      ],
    },
    recommendedAction: {
      action: session.careerGoal
        ? `Build toward: ${session.careerGoal}`
        : baseReport.recommendedAction.action,
      expectedImpact: baseReport.recommendedAction.expectedImpact,
    },
  };

  const insights: XRayInsight = {
    ...baseInsights,
    roleSummary: session.careerGoal
      ? `${session.jobTitle} in ${session.industry || "your industry"} — ${session.careerGoal}. ${baseInsights.roleSummary}`
      : `${session.jobTitle} in ${session.industry || "your industry"}. ${baseInsights.roleSummary}`,
    strengths: strengths.length > 0 ? strengths : baseInsights.strengths,
    transitionRoles,
  };

  return { report, insights };
}

async function fetchFromSupabase(userId: string): Promise<{
  report: XRayCompleteReport;
  insights: XRayInsight;
} | null> {
  const { data: xrayRow, error: xrayError } = await supabase
    .from("xray_reports")
    .select(
      `
      future_readiness_score,
      market_outlook,
      recommended_action,
      scan_id,
      career_scans (
        resilience_score,
        summary,
        scan_inputs (job_title_raw, industry_raw)
      ),
      xray_skill_gaps (skill_label, gap_level, impact_level, benefit_text, sort_order),
      xray_transition_matches (
        rank,
        match_score,
        difficulty,
        transition_time_label,
        why_it_fits,
        trend,
        salary_display,
        occupation_roles (title)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (xrayError || !xrayRow) return null;

  const scan = Array.isArray(xrayRow.career_scans)
    ? xrayRow.career_scans[0]
    : xrayRow.career_scans;
  const inputs = scan?.scan_inputs
    ? Array.isArray(scan.scan_inputs)
      ? scan.scan_inputs[0]
      : scan.scan_inputs
    : null;

  const skillGaps = ((xrayRow.xray_skill_gaps ?? []) as XraySkillGapRow[]).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const transitions = ((xrayRow.xray_transition_matches ?? []) as XrayTransitionRow[])
    .sort((a, b) => a.rank - b.rank)
    .map(
      (row): XRayTransitionRole => ({
        title: getRoleTitle(row),
        matchScore: row.match_score,
        difficulty: mapDifficulty(row.difficulty),
        transitionTime: row.transition_time_label,
        missingSkills: [],
        whyItFits: row.why_it_fits,
        trend: row.trend,
        salary: row.salary_display,
      })
    );

  if (transitions.length === 0) return null;

  const topRole = transitions[0];
  const biggestGap = skillGaps[0];
  const gapAnalysis = skillGaps.map((gap) => ({
    skill: gap.skill_label,
    gap: mapGapLevel(gap.gap_level),
    impact: mapImpactLevel(gap.impact_level),
    benefit: gap.benefit_text,
  }));

  const report: XRayCompleteReport = {
    currentRole: inputs?.job_title_raw ?? xrayCompleteReport.currentRole,
    futureReadinessScore: xrayRow.future_readiness_score ?? scan?.resilience_score ?? 78,
    marketOutlook: xrayRow.market_outlook ?? "Stable Growth",
    topCareerOpportunity: topRole.title,
    topRoleSlug: roleTitleToSlug(topRole.title),
    strongestOpportunity: {
      role: topRole.title,
      matchScore: topRole.matchScore,
      whyLines: [topRole.whyItFits, `Ranked #1 among your personalized transition paths.`],
    },
    biggestSkillGap: biggestGap
      ? {
          skill: biggestGap.skill_label,
          gapLabel: mapGapLevel(biggestGap.gap_level),
          impactLabel: mapImpactLevel(biggestGap.impact_level),
        }
      : xrayCompleteReport.biggestSkillGap,
    recommendedAction: {
      action: xrayRow.recommended_action ?? xrayCompleteReport.recommendedAction.action,
      expectedImpact: xrayCompleteReport.recommendedAction.expectedImpact,
    },
    skillGapAnalysis: gapAnalysis.length > 0 ? gapAnalysis : xrayCompleteReport.skillGapAnalysis,
    skillGapFooterNote: xrayCompleteReport.skillGapFooterNote,
  };

  const insights: XRayInsight = {
    ...xrayInsights,
    roleSummary: scan?.summary ?? xrayInsights.roleSummary,
    resilienceScore: scan?.resilience_score ?? xrayInsights.resilienceScore,
    transitionRoles: transitions,
  };

  return { report, insights };
}

export async function loadCareerXRayData(userId: string | null): Promise<{
  report: XRayCompleteReport;
  insights: XRayInsight;
  source: "database" | "session" | "mock";
}> {
  if (userId) {
    const fromDb = await fetchFromSupabase(userId);
    if (fromDb) {
      return { ...fromDb, source: "database" };
    }
  }

  const session = loadScanSession();
  if (session) {
    return { ...buildFromScanSession(session), source: "session" };
  }

  return { report: xrayCompleteReport, insights: xrayInsights, source: "mock" };
}
