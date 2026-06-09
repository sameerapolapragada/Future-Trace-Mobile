import type { PlanUpdateRecommendation } from "../../types/transition";

export function formatRecommendedUpdate(rec: PlanUpdateRecommendation): string {
  const tasks = rec.proposedChanges.add_tasks ?? [];
  const skill = rec.signalSkillName ?? "new skill";
  const month = rec.targetMonthNumber ? `Month ${rec.targetMonthNumber}` : "a future milestone";

  if (rec.recommendationType === "add_task" && tasks.length > 0) {
    return `Add ${tasks.length} ${skill} task${tasks.length === 1 ? "" : "s"} to ${month}.`;
  }

  return rec.summary;
}

export function formatExpectedImpact(impact: string | null | undefined): string {
  if (!impact) return "Improved readiness for your target role";
  return impact.replace(/readiness points/i, "Readiness");
}
