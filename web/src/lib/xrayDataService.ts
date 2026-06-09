import {
  careerOpportunities,
  xrayCompleteReport,
  xrayInsights,
  roleTitleToSlug,
} from "../data/mockData";
import type {
  CareerOpportunitiesReport,
  CareerOpportunityRole,
  TransitionDifficulty,
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

function mapDifficulty(level: DifficultyDb): TransitionDifficulty {
  if (level === "low") return "Low";
  if (level === "high") return "High";
  return "Medium";
}

function mapTransitionRoleDifficulty(level: DifficultyDb): XRayTransitionRole["difficulty"] {
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

function transitionRoleToOpportunity(role: XRayTransitionRole): CareerOpportunityRole {
  return {
    title: role.title,
    matchScore: role.matchScore,
    difficulty: role.difficulty === "Moderate" ? "Medium" : role.difficulty,
    transitionTime: role.transitionTime,
    salaryRange: role.salary,
    whyFits: role.whyItFits,
    missingSkills: role.missingSkills,
  };
}

function buildOpportunitiesFromRoles(roles: XRayTransitionRole[]): CareerOpportunitiesReport {
  return { recommendedRoles: roles.map(transitionRoleToOpportunity) };
}

function inferTargetRole(careerGoal: string): string {
  const trimmed = careerGoal.trim();
  if (!trimmed) return xrayCompleteReport.targetRole;
  const roleMatch = trimmed.match(
    /(?:into|to|as|become|transition.*?to)\s+(?:an?\s+)?(.+)/i
  );
  if (roleMatch?.[1]) {
    return roleMatch[1].replace(/\.$/, "").trim();
  }
  return trimmed.length > 60 ? xrayCompleteReport.targetRole : trimmed;
}

function buildFromScanSession(session: NonNullable<ReturnType<typeof loadScanSession>>): {
  report: XRayCompleteReport;
  insights: XRayInsight;
  opportunities: CareerOpportunitiesReport;
} {
  const skills = parseSkillList(session.currentSkills);
  const tools = parseSkillList(session.toolsUsed);
  const strengths = [...new Set([...skills.slice(0, 3), ...tools.slice(0, 1)])].filter(Boolean);
  const baseReport = xrayCompleteReport;
  const baseInsights = xrayInsights;
  const targetRole = inferTargetRole(session.careerGoal);

  const transitionRoles = baseInsights.transitionRoles.map((role) => ({
    ...role,
    whyItFits: personalizeWhyItFits(role.whyItFits, session.jobTitle, session.industry),
  }));

  const report: XRayCompleteReport = {
    ...baseReport,
    currentRole: session.jobTitle,
    targetRole,
    transferableStrengths: strengths.length
      ? strengths.map((name) => ({
          name,
          whyItMatters: `Directly supports your transition from ${session.jobTitle} toward ${targetRole}.`,
        }))
      : baseReport.transferableStrengths,
    recommendedAction: {
      ...baseReport.recommendedAction,
      primaryAction: session.careerGoal
        ? `Build toward: ${targetRole}`
        : baseReport.recommendedAction.primaryAction,
      why: session.careerGoal
        ? `Your goal — "${session.careerGoal}" — requires closing the technical gaps identified below.`
        : baseReport.recommendedAction.why,
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

  return {
    report,
    insights,
    opportunities: buildOpportunitiesFromRoles(transitionRoles),
  };
}

async function fetchFromSupabase(userId: string): Promise<{
  report: XRayCompleteReport;
  insights: XRayInsight;
  opportunities: CareerOpportunitiesReport;
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
        scan_inputs (job_title_raw, industry_raw, career_goal_text)
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
        difficulty: mapTransitionRoleDifficulty(row.difficulty),
        transitionTime: row.transition_time_label,
        missingSkills: [],
        whyItFits: row.why_it_fits,
        trend: row.trend,
        salary: row.salary_display,
      })
    );

  const gapRows =
    skillGaps.length > 0
      ? skillGaps.map((gap) => ({
          skill: gap.skill_label,
          gap: mapGapLevel(gap.gap_level),
          impact: mapImpactLevel(gap.impact_level),
          whyItMatters: gap.benefit_text,
        }))
      : xrayCompleteReport.skillGaps;

  const readiness = xrayRow.future_readiness_score ?? scan?.resilience_score ?? 78;
  const currentRole = inputs?.job_title_raw ?? xrayCompleteReport.currentRole;
  const targetRole = inputs?.career_goal_text
    ? inferTargetRole(inputs.career_goal_text)
    : xrayCompleteReport.targetRole;
  const topTransition = transitions[0];

  const report: XRayCompleteReport = {
    ...xrayCompleteReport,
    currentRole,
    targetRole,
    futureReadinessScore: readiness,
    transitionFit: readiness >= 80 ? "Strong" : readiness >= 60 ? "Moderate" : "Weak",
    transitionDifficulty: topTransition
      ? mapDifficulty(
          topTransition.difficulty === "Low"
            ? "low"
            : topTransition.difficulty === "High"
              ? "high"
              : "moderate"
        )
      : xrayCompleteReport.transitionDifficulty,
    estimatedTransitionTime:
      topTransition?.transitionTime ?? xrayCompleteReport.estimatedTransitionTime,
    skillGaps: gapRows,
    recommendedAction: {
      ...xrayCompleteReport.recommendedAction,
      primaryAction: xrayRow.recommended_action ?? xrayCompleteReport.recommendedAction.primaryAction,
    },
    transitionSnapshot: {
      ...xrayCompleteReport.transitionSnapshot,
      readiness,
      transitionTime:
        topTransition?.transitionTime ?? xrayCompleteReport.transitionSnapshot.transitionTime,
      difficulty: topTransition
        ? mapDifficulty(
            topTransition.difficulty === "Low"
              ? "low"
              : topTransition.difficulty === "High"
                ? "high"
                : "moderate"
          )
        : xrayCompleteReport.transitionSnapshot.difficulty,
    },
  };

  const insights: XRayInsight = {
    ...xrayInsights,
    roleSummary: scan?.summary ?? xrayInsights.roleSummary,
    resilienceScore: scan?.resilience_score ?? xrayInsights.resilienceScore,
    transitionRoles: transitions.length > 0 ? transitions : xrayInsights.transitionRoles,
  };

  const opportunities = buildOpportunitiesFromRoles(insights.transitionRoles);

  return { report, insights, opportunities };
}

export async function loadCareerXRayData(userId: string | null): Promise<{
  report: XRayCompleteReport;
  insights: XRayInsight;
  opportunities: CareerOpportunitiesReport;
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

  return {
    report: xrayCompleteReport,
    insights: xrayInsights,
    opportunities: careerOpportunities,
    source: "mock",
  };
}

export { roleTitleToSlug };
