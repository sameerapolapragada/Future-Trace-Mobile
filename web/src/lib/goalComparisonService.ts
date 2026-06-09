import type { CareerXRaySnapshotResult, CareerXrayRecord } from "../types";
import type { CareerGoal } from "../types/transition";

export type GoalComparisonMetrics = {
  targetRole: string;
  currentRole: string;
  readinessScore: number;
  readinessLabel: string;
  transitionDifficulty: string;
  estimatedTransitionTime: string;
  salaryUpside: string;
  marketDemand: string;
  topStrengths: string[];
  biggestSkillGaps: string[];
  recommendedNextAction: string;
};

export type GoalComparisonRow = {
  metric: string;
  currentValue: string;
  newValue: string;
  tone?: "better-current" | "better-new" | "neutral" | "risk";
};

function readinessLabel(score: number): string {
  return `${score}/100`;
}

export function metricsFromXrayResult(
  result: CareerXRaySnapshotResult | null,
  fallbackTarget: string,
  fallbackCurrent: string
): GoalComparisonMetrics {
  const report = result?.report;
  const opportunities = result?.opportunities;
  const topRole = opportunities?.recommendedRoles?.[0];
  const snapshot = report?.transitionSnapshot;

  return {
    targetRole: report?.targetRole ?? fallbackTarget,
    currentRole: report?.currentRole ?? fallbackCurrent,
    readinessScore: report?.futureReadinessScore ?? snapshot?.readiness ?? 0,
    readinessLabel: readinessLabel(report?.futureReadinessScore ?? snapshot?.readiness ?? 0),
    transitionDifficulty: report?.transitionDifficulty ?? snapshot?.difficulty ?? "—",
    estimatedTransitionTime: report?.estimatedTransitionTime ?? snapshot?.transitionTime ?? "—",
    salaryUpside: report?.salaryUpside ?? snapshot?.salaryUpside ?? "—",
    marketDemand:
      snapshot?.marketDemand ??
      (topRole && topRole.matchScore >= 85 ? "Very High" : topRole && topRole.matchScore >= 70 ? "High" : "Moderate"),
    topStrengths: (report?.transferableStrengths ?? []).slice(0, 3).map((s) => s.name),
    biggestSkillGaps: (report?.skillGaps ?? []).slice(0, 3).map((g) => g.skill),
    recommendedNextAction:
      report?.recommendedAction?.primaryAction ??
      topRole?.whyFits?.slice(0, 120) ??
      "Complete your first weekly milestone to build momentum.",
  };
}

export function metricsFromGoal(goal: CareerGoal): GoalComparisonMetrics {
  return {
    targetRole: goal.targetRole,
    currentRole: goal.currentRole,
    readinessScore: goal.readinessScore,
    readinessLabel: readinessLabel(goal.readinessScore),
    transitionDifficulty: goal.transitionDifficulty ?? "—",
    estimatedTransitionTime: goal.estimatedTransitionTime ?? "—",
    salaryUpside: goal.salaryUpside ?? "—",
    marketDemand: goal.marketDemand ?? "High",
    topStrengths: goal.topStrengths ?? [],
    biggestSkillGaps: goal.biggestSkillGaps ?? [],
    recommendedNextAction: goal.recommendedNextAction ?? "Continue your current transition plan.",
  };
}

export function metricsFromXrayRecord(
  xray: CareerXrayRecord,
  scanTarget: string,
  scanCurrent: string
): GoalComparisonMetrics {
  if (xray.result) {
    return metricsFromXrayResult(xray.result, scanTarget, scanCurrent);
  }

  return {
    targetRole: scanTarget,
    currentRole: scanCurrent,
    readinessScore: 0,
    readinessLabel: "—",
    transitionDifficulty: "—",
    estimatedTransitionTime: "—",
    salaryUpside: "—",
    marketDemand: "—",
    topStrengths: [],
    biggestSkillGaps: [],
    recommendedNextAction: "—",
  };
}

function difficultyRank(d: string): number {
  const lower = d.toLowerCase();
  if (lower.includes("low")) return 1;
  if (lower.includes("medium") || lower.includes("moderate")) return 2;
  if (lower.includes("high")) return 3;
  return 2;
}

function parseMonthsRange(time: string): { low: number; high: number } | null {
  const match = time.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (match) return { low: Number(match[1]), high: Number(match[2]) };
  const single = time.match(/(\d+)/);
  if (single) return { low: Number(single[1]), high: Number(single[1]) };
  return null;
}

function compareTone(
  metric: string,
  current: string,
  next: string
): GoalComparisonRow["tone"] {
  if (metric === "Readiness Score") {
    const c = parseInt(current, 10);
    const n = parseInt(next, 10);
    if (!Number.isNaN(c) && !Number.isNaN(n)) {
      if (n > c) return "better-new";
      if (c > n) return "better-current";
    }
    return "neutral";
  }
  if (metric === "Transition Difficulty") {
    const c = difficultyRank(current);
    const n = difficultyRank(next);
    if (n < c) return "better-new";
    if (c < n) return "risk";
    return "neutral";
  }
  if (metric === "Estimated Transition Time") {
    const c = parseMonthsRange(current);
    const n = parseMonthsRange(next);
    if (c && n) {
      if (n.high < c.low) return "better-new";
      if (n.low > c.high) return "risk";
    }
    return "neutral";
  }
  return "neutral";
}

export function buildComparisonRows(
  current: GoalComparisonMetrics,
  next: GoalComparisonMetrics
): GoalComparisonRow[] {
  const rows: Omit<GoalComparisonRow, "tone">[] = [
    { metric: "Target Role", currentValue: current.targetRole, newValue: next.targetRole },
    { metric: "Readiness Score", currentValue: current.readinessLabel, newValue: next.readinessLabel },
    { metric: "Transition Difficulty", currentValue: current.transitionDifficulty, newValue: next.transitionDifficulty },
    { metric: "Estimated Transition Time", currentValue: current.estimatedTransitionTime, newValue: next.estimatedTransitionTime },
    { metric: "Salary Upside", currentValue: current.salaryUpside, newValue: next.salaryUpside },
    { metric: "Market Demand", currentValue: current.marketDemand, newValue: next.marketDemand },
    {
      metric: "Top Strengths",
      currentValue: current.topStrengths.join(", ") || "—",
      newValue: next.topStrengths.join(", ") || "—",
    },
    {
      metric: "Biggest Skill Gaps",
      currentValue: current.biggestSkillGaps.join(", ") || "—",
      newValue: next.biggestSkillGaps.join(", ") || "—",
    },
    {
      metric: "Recommended Next Action",
      currentValue: current.recommendedNextAction,
      newValue: next.recommendedNextAction,
    },
  ];

  return rows.map((row) => ({
    ...row,
    tone: compareTone(row.metric, row.currentValue, row.newValue),
  }));
}

export function buildRecommendation(
  current: GoalComparisonMetrics,
  next: GoalComparisonMetrics
): string {
  const newFaster =
    (parseMonthsRange(next.estimatedTransitionTime)?.high ?? 99) <
    (parseMonthsRange(current.estimatedTransitionTime)?.low ?? 0);
  const newEasier = difficultyRank(next.transitionDifficulty) < difficultyRank(current.transitionDifficulty);
  const newHigherReadiness = next.readinessScore > current.readinessScore;

  if (newFaster && newEasier && newHigherReadiness) {
    return `${next.targetRole} appears to be a faster and lower-friction transition based on your current skills. However, ${current.targetRole} may offer stronger long-term upside if you're willing to invest more time.`;
  }
  if (newHigherReadiness && newEasier) {
    return `${next.targetRole} looks like a strong fit with higher readiness and manageable difficulty. ${current.targetRole} is still a viable path if you want to stay the course.`;
  }
  if (current.readinessScore > next.readinessScore) {
    return `Your current goal toward ${current.targetRole} shows stronger readiness today. ${next.targetRole} is worth exploring, but may require more upskilling before committing.`;
  }
  return `Both paths have trade-offs. Compare timeline, difficulty, and salary upside before switching your active goal.`;
}

export function denormalizedMetricsFromResult(result: CareerXRaySnapshotResult): {
  readinessScore: number;
  transitionDifficulty: string;
  estimatedTransitionTime: string;
  salaryUpside: string;
  marketDemand: string;
} {
  const m = metricsFromXrayResult(result, "", "");
  return {
    readinessScore: m.readinessScore,
    transitionDifficulty: m.transitionDifficulty,
    estimatedTransitionTime: m.estimatedTransitionTime,
    salaryUpside: m.salaryUpside,
    marketDemand: m.marketDemand,
  };
}
