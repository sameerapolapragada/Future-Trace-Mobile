import type { WeeklyMilestone, WeeklyMilestoneStatus } from "../../types/transition";

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function milestoneStatusLabel(
  milestone: WeeklyMilestone,
  currentId: string | null
): "Completed" | "Current" | "Upcoming" | "Missed" | "In progress" {
  if (milestone.status === "completed") return "Completed";
  if (milestone.status === "missed") return "Missed";
  if (milestone.id === currentId || milestone.status === "in_progress") return "Current";
  const today = new Date().toISOString().slice(0, 10);
  if (milestone.startDate > today) return "Upcoming";
  if (milestone.status === "not_started") return "Upcoming";
  return "In progress";
}

export function milestoneStatusTone(status: WeeklyMilestoneStatus, isCurrent: boolean): string {
  if (status === "completed") return "text-success border-success/30 bg-success/10";
  if (status === "missed") return "text-danger border-danger/30 bg-danger/10";
  if (isCurrent || status === "in_progress") return "text-accent-gold border-accent-purple/30 bg-accent-purple/10";
  return "text-muted border-white/10 bg-white/5";
}

export type TimelineWeekStatus = "completed" | "in_progress" | "upcoming" | "missed" | "locked";

export function timelineWeekStatus(
  milestone: WeeklyMilestone,
  currentId: string | null
): TimelineWeekStatus {
  if (!milestone.isUnlocked || milestone.status === "locked") return "locked";
  if (milestone.status === "completed") return "completed";
  if (milestone.status === "missed") return "missed";
  if (milestone.id === currentId || milestone.status === "in_progress") return "in_progress";
  return "upcoming";
}

export function timelineStatusBadge(status: TimelineWeekStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-success/20 text-success border-success/30",
      };
    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-accent-purple/20 text-accent-gold border-accent-purple/30",
      };
    case "missed":
      return {
        label: "Missed",
        className: "bg-danger/20 text-danger border-danger/30",
      };
    case "locked":
      return {
        label: "Locked",
        className: "bg-white/5 text-muted border-white/10",
      };
    default:
      return {
        label: "Upcoming",
        className: "bg-white/8 text-muted border-white/10",
      };
  }
}

/** Short subtitle for timeline rows. */
export function milestoneSubtitle(description: string): string {
  const first = description.split(/[.!?]/)[0]?.trim();
  if (!first) return description;
  return first.length > 72 ? `${first.slice(0, 69)}…` : first;
}

export function formatMilestoneDueDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

/** Display range for estimated weekly effort (matches milestone detail mock). */
export function formatEstimatedEffort(hours: number): string {
  const low = Math.max(1, Math.floor(hours));
  const high = Math.max(low + 1, Math.ceil(hours + 1));
  return `${low} – ${high} hours`;
}

/** Readiness points gained for completing a given week. */
export function weeklyReadinessMin(_weekNumber: number): number {
  return 5;
}

export function weeklyReadinessMax(_weekNumber: number): number {
  return 8;
}

/** Short copy for the “Why this matters” footer. */
export function milestoneWhyItMatters(milestone: WeeklyMilestone): string {
  const sentences = milestone.description.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) return sentences.slice(1).join(" ");
  return milestone.expectedOutcome;
}
