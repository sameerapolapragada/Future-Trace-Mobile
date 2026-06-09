import { supabase } from "../supabaseClient";
import type {
  TransitionNotification,
  TransitionNotificationType,
  WeeklyMilestone,
} from "../../types/transition";

function mapNotification(row: Record<string, unknown>): TransitionNotification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    goalId: (row.goal_id as string | null) ?? null,
    milestoneId: (row.milestone_id as string | null) ?? null,
    planUpdateId: (row.plan_update_id as string | null) ?? null,
    notificationType: row.notification_type as TransitionNotification["notificationType"],
    title: row.title as string,
    message: row.message as string,
    scheduledFor: row.scheduled_for as string,
    sentAt: (row.sent_at as string | null) ?? null,
    readAt: (row.read_at as string | null) ?? null,
    status: row.status as TransitionNotification["status"],
    createdAt: row.created_at as string,
  };
}

function atLocalTime(dateStr: string, hour: number, minute = 0): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function midpointDate(start: string, due: string): string {
  const startMs = new Date(`${start}T12:00:00`).getTime();
  const dueMs = new Date(`${due}T12:00:00`).getTime();
  const mid = new Date((startMs + dueMs) / 2);
  return mid.toISOString().slice(0, 10);
}

function dayBefore(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function buildMilestoneNotifications(
  userId: string,
  goalId: string,
  milestone: Pick<WeeklyMilestone, "id" | "weekNumber" | "title" | "startDate" | "dueDate">
): Array<{
  user_id: string;
  goal_id: string;
  milestone_id: string;
  notification_type: TransitionNotificationType;
  title: string;
  message: string;
  scheduled_for: string;
  status: "scheduled";
}> {
  const mid = midpointDate(milestone.startDate, milestone.dueDate);
  const beforeDue = dayBefore(milestone.dueDate);

  return [
    {
      user_id: userId,
      goal_id: goalId,
      milestone_id: milestone.id,
      notification_type: "weekly_start",
      title: `Week ${milestone.weekNumber} starts today`,
      message: `Your milestone "${milestone.title}" is ready. Open this week's tasks and block time on your calendar.`,
      scheduled_for: atLocalTime(milestone.startDate, 9, 0),
      status: "scheduled",
    },
    {
      user_id: userId,
      goal_id: goalId,
      milestone_id: milestone.id,
      notification_type: "midweek_reminder",
      title: `Midweek check-in: Week ${milestone.weekNumber}`,
      message: `You're halfway through "${milestone.title}". Complete at least one task to stay on track.`,
      scheduled_for: atLocalTime(mid, 18, 0),
      status: "scheduled",
    },
    {
      user_id: userId,
      goal_id: goalId,
      milestone_id: milestone.id,
      notification_type: "deadline_reminder",
      title: `Due tomorrow: Week ${milestone.weekNumber}`,
      message: `"${milestone.title}" is due soon. Finish remaining tasks or plan a short extension.`,
      scheduled_for: atLocalTime(beforeDue, 18, 0),
      status: "scheduled",
    },
  ];
}

export async function scheduleMilestoneNotifications(
  userId: string,
  goalId: string,
  milestones: WeeklyMilestone[]
): Promise<void> {
  const rows = milestones.flatMap((m) => buildMilestoneNotifications(userId, goalId, m));
  if (rows.length === 0) return;

  const { error } = await supabase.from("transition_notifications").insert(rows);
  if (error) throw error;
}

export async function cancelScheduledMilestoneNotifications(milestoneId: string): Promise<void> {
  const { error } = await supabase
    .from("transition_notifications")
    .update({ status: "cancelled" })
    .eq("milestone_id", milestoneId)
    .eq("status", "scheduled");

  if (error) throw error;
}

export async function createCompletionCelebration(
  userId: string,
  goalId: string,
  milestone: Pick<WeeklyMilestone, "id" | "weekNumber" | "title">
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("transition_notifications").insert({
    user_id: userId,
    goal_id: goalId,
    milestone_id: milestone.id,
    notification_type: "completion_celebration",
    title: `Week ${milestone.weekNumber} complete!`,
    message: `You finished "${milestone.title}". Your readiness score just got a boost — open next week's plan when you're ready.`,
    scheduled_for: now,
    sent_at: now,
    status: "sent",
  });

  if (error) throw error;
}

export async function createMissedMilestoneNotification(
  userId: string,
  goalId: string,
  milestone: Pick<WeeklyMilestone, "id" | "weekNumber" | "title" | "dueDate">
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("transition_notifications").insert({
    user_id: userId,
    goal_id: goalId,
    milestone_id: milestone.id,
    notification_type: "missed_milestone",
    title: `Week ${milestone.weekNumber} milestone missed`,
    message: `"${milestone.title}" passed its due date (${milestone.dueDate}). You can extend the timeline from your transition plan.`,
    scheduled_for: now,
    sent_at: now,
    status: "sent",
  });

  if (error) throw error;
}

/** Promote due scheduled notifications to sent (MVP in-app delivery). */
export async function processDueNotifications(userId: string): Promise<void> {
  const now = new Date().toISOString();

  const { data: due, error: fetchError } = await supabase
    .from("transition_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (fetchError) throw fetchError;
  if (!due?.length) return;

  const ids = due.map((r) => r.id as string);
  const { error } = await supabase
    .from("transition_notifications")
    .update({ status: "sent", sent_at: now })
    .in("id", ids);

  if (error) throw error;
}

export async function fetchUserNotifications(userId: string): Promise<TransitionNotification[]> {
  const { data, error } = await supabase
    .from("transition_notifications")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .order("scheduled_for", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("transition_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "sent")
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("transition_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("transition_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "sent")
    .is("read_at", null);

  if (error) throw error;
}
