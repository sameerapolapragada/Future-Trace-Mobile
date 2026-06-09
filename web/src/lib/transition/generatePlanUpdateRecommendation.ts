import type { CareerGoal, WeeklyMilestone, WeeklyMilestoneWithTasks } from "../../types/transition";
import type { CareerMarketSignal, PlanUpdateRecommendationDraft } from "./planUpdateTypes";

export type { CareerMarketSignal, PlanUpdateRecommendationDraft };

/** Client-side recommendation generator (used when enriching before RPC persist). */
export function generatePlanUpdateRecommendation(input: {
  goal: CareerGoal;
  signal: CareerMarketSignal;
  milestones: WeeklyMilestone[];
  currentWeek: WeeklyMilestone | null;
  completedMilestoneIds: Set<string>;
}): PlanUpdateRecommendationDraft | null {
  const { goal, signal, milestones, currentWeek, completedMilestoneIds } = input;

  const futureMilestones = milestones.filter(
    (m) =>
      m.status !== "completed" &&
      m.status !== "skipped" &&
      !completedMilestoneIds.has(m.id) &&
      (!currentWeek || m.weekNumber > currentWeek.weekNumber + 1)
  );

  const target = futureMilestones[0] ?? milestones.find((m) => m.status === "not_started");
  if (!target) return null;

  const monthLabel = `Month ${target.unlockMonthNumber}`;

  return {
    recommendationType: "add_task",
    title: `Add ${signal.skillName} basics to ${monthLabel}`,
    summary: signal.signalSummary,
    whyItMatters: `${signal.skillName} may improve your readiness for roles involving AI workflows.`,
    expectedImpact: "+6 readiness points",
    targetMilestoneId: target.id,
    proposedChanges: {
      add_tasks: [
        {
          title: `Map one ${signal.skillName} use case for your target industry`,
          description: `Research how ${signal.skillName} applies in ${goal.targetRole} contexts.`,
          estimated_minutes: 45,
          task_type: "research",
        },
        {
          title: `Write a one-page product note for a ${signal.skillName} workflow`,
          description: "Document problem, approach, and outcome for a realistic scenario.",
          estimated_minutes: 60,
          task_type: "build",
        },
      ],
    },
  };
}

export function milestoneTaskTitles(milestones: WeeklyMilestoneWithTasks[]): string {
  return milestones
    .flatMap((m) => m.tasks.map((t) => t.title.toLowerCase()))
    .join(" ");
}

export function signalAlreadyCovered(signal: CareerMarketSignal, taskTitles: string): boolean {
  return taskTitles.includes(signal.skillName.toLowerCase());
}
