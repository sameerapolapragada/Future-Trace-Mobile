import type { MilestoneTask, WeeklyMilestone, WeeklyMilestoneWithTasks } from "../../types/transition";

export function unlockMonthForWeek(weekNumber: number): number {
  return Math.ceil(weekNumber / 4);
}

export function unlockDateForMonth(goalStartedAt: string, monthNumber: number): string {
  const d = new Date(goalStartedAt);
  d.setDate(d.getDate() + (monthNumber - 1) * 30);
  return d.toISOString();
}

export function lockedPreviewDescription(monthNumber: number): string {
  if (monthNumber <= 1) return "Available now";
  if (monthNumber === 2) return "Unlocks next month";
  return "Unlocks when Month 2 opens";
}

export function lockedPreviewTitle(fullTitle: string): string {
  const words = fullTitle.split(/\s+/).slice(0, 3);
  return words.join(" ");
}

function mapTaskFromJson(row: Record<string, unknown>): MilestoneTask {
  return {
    id: row.id as string,
    milestoneId: row.milestone_id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    taskType: row.task_type as MilestoneTask["taskType"],
    estimatedMinutes: row.estimated_minutes as number,
    status: row.status as MilestoneTask["status"],
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapMilestoneFromJson(row: Record<string, unknown>): WeeklyMilestone {
  return {
    id: row.id as string,
    goalId: row.goal_id as string,
    userId: row.user_id as string,
    weekNumber: row.week_number as number,
    title: row.title as string,
    description: row.description as string,
    expectedOutcome: (row.expected_outcome as string) ?? "",
    estimatedHours: Number(row.estimated_hours ?? 0),
    startDate: row.start_date as string,
    dueDate: row.due_date as string,
    status: row.status as WeeklyMilestone["status"],
    completionPercentage: (row.completion_percentage as number) ?? 0,
    unlockMonthNumber: (row.unlock_month_number as number) ?? 1,
    unlockDate: (row.unlock_date as string | null) ?? null,
    isUnlocked: row.is_unlocked !== false,
    lockedPreviewTitle: (row.locked_preview_title as string | null) ?? null,
    lockedPreviewDescription: (row.locked_preview_description as string | null) ?? null,
    fullContentRevealedAt: (row.full_content_revealed_at as string | null) ?? null,
    lastAdaptiveUpdateAt: (row.last_adaptive_update_at as string | null) ?? null,
    adaptiveUpdateNote: (row.adaptive_update_note as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapMilestoneWithTasksFromJson(row: Record<string, unknown>): WeeklyMilestoneWithTasks {
  const tasksRaw = row.tasks;
  const tasks = Array.isArray(tasksRaw)
    ? tasksRaw.map((t) => mapTaskFromJson(t as Record<string, unknown>))
    : [];

  return {
    ...mapMilestoneFromJson(row),
    tasks,
  };
}

export class MilestoneLockedError extends Error {
  constructor() {
    super("milestone_locked");
    this.name = "MilestoneLockedError";
  }
}
