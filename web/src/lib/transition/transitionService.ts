import { supabase } from "../supabaseClient";
import { fetchCareerScan } from "../scanService";
import {
  denormalizedMetricsFromResult,
  metricsFromXrayResult,
} from "../goalComparisonService";
import {
  lockedPreviewDescription,
  lockedPreviewTitle,
  mapMilestoneFromJson,
  mapMilestoneWithTasksFromJson,
  MilestoneLockedError,
  unlockDateForMonth,
  unlockMonthForWeek,
} from "./milestoneAccess";
import { mapXrayRow } from "../accessService";
import { canSwitchGoal, incrementGoalSwitchUsage } from "../subscriptionUsageService";
import type { CareerXRaySnapshotResult } from "../../types";
import { generateWeeklyMilestones } from "./generateWeeklyMilestones";
import {
  cancelScheduledMilestoneNotifications,
  createCompletionCelebration,
  createMissedMilestoneNotification,
  processDueNotifications,
  scheduleMilestoneNotifications,
} from "./notificationService";
import type {
  CareerGoal,
  MilestoneTask,
  WeeklyMilestone,
  WeeklyMilestoneWithTasks,
} from "../../types/transition";

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function mapGoal(row: Record<string, unknown>): CareerGoal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    currentRole: row.current_role as string,
    targetRole: row.target_role as string,
    sourceScanId: (row.source_scan_id as string | null) ?? null,
    sourceXrayId: (row.source_xray_id as string | null) ?? null,
    status: row.status as CareerGoal["status"],
    readinessScore: row.readiness_score as number,
    transitionDifficulty: (row.transition_difficulty as string | null) ?? null,
    estimatedTransitionTime: (row.estimated_transition_time as string | null) ?? null,
    salaryUpside: (row.salary_upside as string | null) ?? null,
    marketDemand: (row.market_demand as string | null) ?? null,
    topStrengths: parseStringArray(row.top_strengths),
    biggestSkillGaps: parseStringArray(row.biggest_skill_gaps),
    recommendedNextAction: (row.recommended_next_action as string | null) ?? null,
    planLengthWeeks: row.plan_length_weeks as 8 | 12,
    startedAt: row.started_at as string,
    pausedAt: (row.paused_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    targetCompletionDate: (row.target_completion_date as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function goalPayloadFromXray(
  userId: string,
  scanId: string,
  xrayId: string,
  currentRole: string,
  targetRole: string,
  result: CareerXRaySnapshotResult | null,
  planLengthWeeks: 8 | 12
) {
  const metrics = result
    ? metricsFromXrayResult(result, targetRole, currentRole)
    : null;
  const denorm = result ? denormalizedMetricsFromResult(result) : null;
  const start = new Date();
  const targetEnd = new Date(start);
  targetEnd.setDate(targetEnd.getDate() + planLengthWeeks * 7);

  return {
    user_id: userId,
    current_role: currentRole,
    target_role: targetRole,
    source_scan_id: scanId,
    source_xray_id: xrayId,
    readiness_score: denorm?.readinessScore ?? 0,
    transition_difficulty: denorm?.transitionDifficulty ?? null,
    estimated_transition_time: denorm?.estimatedTransitionTime ?? null,
    salary_upside: denorm?.salaryUpside ?? null,
    market_demand: denorm?.marketDemand ?? null,
    top_strengths: metrics?.topStrengths ?? [],
    biggest_skill_gaps: metrics?.biggestSkillGaps ?? [],
    recommended_next_action: metrics?.recommendedNextAction ?? null,
    plan_length_weeks: planLengthWeeks,
    target_completion_date: targetEnd.toISOString(),
    status: "active" as const,
    started_at: start.toISOString(),
  };
}

function mapMilestone(row: Record<string, unknown>): WeeklyMilestone {
  return mapMilestoneFromJson({
    ...row,
    expected_outcome: row.expected_outcome,
    estimated_hours: row.estimated_hours,
    unlock_month_number: row.unlock_month_number ?? unlockMonthForWeek(row.week_number as number),
    unlock_date: row.unlock_date,
    is_unlocked: row.is_unlocked ?? true,
    locked_preview_title: row.locked_preview_title,
    locked_preview_description: row.locked_preview_description,
    full_content_revealed_at: row.full_content_revealed_at,
  });
}

function mapTask(row: Record<string, unknown>): MilestoneTask {
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

export async function fetchActiveGoal(userId: string): Promise<CareerGoal | null> {
  const { data, error } = await supabase
    .from("career_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data ? mapGoal(data as Record<string, unknown>) : null;
}

export async function fetchGoal(userId: string, goalId: string): Promise<CareerGoal | null> {
  const { data, error } = await supabase
    .from("career_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("id", goalId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapGoal(data as Record<string, unknown>) : null;
}

/** Server-enforced visibility: full details only for unlocked months. */
export async function fetchVisibleMilestonesForGoal(
  _userId: string,
  goalId: string
): Promise<WeeklyMilestone[]> {
  const { data, error } = await supabase.rpc("get_visible_milestones", {
    p_goal_id: goalId,
  });

  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map((row) => mapMilestoneFromJson(row));
}

/** @deprecated Use fetchVisibleMilestonesForGoal */
export async function fetchMilestonesForGoal(
  userId: string,
  goalId: string
): Promise<WeeklyMilestone[]> {
  return fetchVisibleMilestonesForGoal(userId, goalId);
}

export async function fetchMilestoneWithTasks(
  _userId: string,
  milestoneId: string
): Promise<WeeklyMilestoneWithTasks | null> {
  const { data, error } = await supabase.rpc("get_visible_milestone_with_tasks", {
    p_milestone_id: milestoneId,
  });

  if (error) {
    if (error.message?.includes("milestone_locked")) {
      throw new MilestoneLockedError();
    }
    throw error;
  }

  if (!data) return null;
  return mapMilestoneWithTasksFromJson(data as Record<string, unknown>);
}

export async function ensureActiveGoalFromLatestScan(
  userId: string,
  planLengthWeeks: 8 | 12 = 8
): Promise<CareerGoal | null> {
  const existing = await fetchActiveGoal(userId);
  if (existing) return existing;

  const { data: scans, error } = await supabase
    .from("career_scans")
    .select("id, current_role, target_role, result, resilience_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  const scan = scans?.[0];
  if (!scan) return null;

  const currentRole =
    (scan.current_role as string) ||
    ((scan.result as { currentRole?: string } | null)?.currentRole ?? "Current Role");
  const targetRole =
    (scan.target_role as string) ||
    ((scan.result as { targetRole?: string } | null)?.targetRole ?? "Target Role");

  const start = new Date();
  const targetEnd = new Date(start);
  targetEnd.setDate(targetEnd.getDate() + planLengthWeeks * 7);

  const { data: goal, error: gError } = await supabase
    .from("career_goals")
    .insert({
      user_id: userId,
      current_role: currentRole,
      target_role: targetRole,
      source_scan_id: scan.id,
      readiness_score: (scan.resilience_score as number) ?? 0,
      plan_length_weeks: planLengthWeeks,
      target_completion_date: targetEnd.toISOString(),
      status: "active",
    })
    .select("*")
    .single();

  if (gError) throw gError;

  const mapped = mapGoal(goal as Record<string, unknown>);
  await generateAndPersistWeeklyMilestones(userId, mapped, scan.id as string);
  return mapped;
}

export async function generateAndPersistWeeklyMilestones(
  userId: string,
  goal: CareerGoal,
  sourceScanId?: string
): Promise<WeeklyMilestone[]> {
  const existing = await fetchVisibleMilestonesForGoal(userId, goal.id);
  if (existing.length > 0) return existing;

  let xrayResultJson: unknown;
  if (sourceScanId ?? goal.sourceScanId) {
    const scan = await fetchCareerScan(userId, sourceScanId ?? goal.sourceScanId!);
    const { data: xray } = await supabase
      .from("career_xrays")
      .select("xray_result_json")
      .eq("scan_id", scan?.id ?? sourceScanId)
      .eq("user_id", userId)
      .maybeSingle();
    xrayResultJson = xray?.xray_result_json;
  }

  const drafts = generateWeeklyMilestones({
    userId,
    goalId: goal.id,
    currentRole: goal.currentRole,
    targetRole: goal.targetRole,
    planLengthWeeks: goal.planLengthWeeks,
    xrayResultJson,
    startDate: new Date(goal.startedAt),
  });

  const saved: WeeklyMilestone[] = [];

  for (const draft of drafts) {
    const unlockMonth = unlockMonthForWeek(draft.weekNumber);
    const isUnlocked = unlockMonth === 1;

    const { data: milestone, error: mError } = await supabase
      .from("weekly_milestones")
      .insert({
        goal_id: goal.id,
        user_id: userId,
        week_number: draft.weekNumber,
        title: draft.title,
        description: draft.description,
        expected_outcome: draft.expectedOutcome,
        estimated_hours: draft.estimatedHours,
        start_date: draft.startDate,
        due_date: draft.dueDate,
        status: draft.status,
        completion_percentage: 0,
        unlock_month_number: unlockMonth,
        unlock_date: unlockDateForMonth(goal.startedAt, unlockMonth),
        is_unlocked: isUnlocked,
        locked_preview_title: lockedPreviewTitle(draft.title),
        locked_preview_description: lockedPreviewDescription(unlockMonth),
        full_content_revealed_at: isUnlocked ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (mError) throw mError;
    const mapped = mapMilestone(milestone as Record<string, unknown>);
    saved.push(mapped);

    if (draft.tasks.length) {
      const { error: tError } = await supabase.from("milestone_tasks").insert(
        draft.tasks.map((task) => ({
          milestone_id: mapped.id,
          user_id: userId,
          title: task.title,
          description: task.description,
          task_type: task.taskType,
          estimated_minutes: task.estimatedMinutes,
          status: "pending",
        }))
      );
      if (tError) throw tError;
    }
  }

  await scheduleMilestoneNotifications(userId, goal.id, saved);
  return saved;
}

function recalcCompletion(tasks: MilestoneTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

export async function completeTask(userId: string, taskId: string): Promise<void> {
  const now = new Date().toISOString();
  const { data: task, error } = await supabase
    .from("milestone_tasks")
    .update({ status: "completed", completed_at: now })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("milestone_id")
    .single();

  if (error) throw error;

  await syncMilestoneProgress(userId, task.milestone_id as string);
}

async function syncMilestoneProgress(userId: string, milestoneId: string): Promise<void> {
  const { data: tasks, error: tError } = await supabase
    .from("milestone_tasks")
    .select("*")
    .eq("milestone_id", milestoneId);

  if (tError) throw tError;
  const mapped = (tasks ?? []).map((row) => mapTask(row as Record<string, unknown>));
  const pct = recalcCompletion(mapped);
  const allDone = mapped.length > 0 && mapped.every((t) => t.status === "completed");

  const { data: milestone, error: mError } = await supabase
    .from("weekly_milestones")
    .update({
      completion_percentage: pct,
      status: allDone ? "completed" : pct > 0 ? "in_progress" : "not_started",
    })
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (mError) throw mError;

  if (allDone) {
    const goalId = milestone.goal_id as string;
    await cancelScheduledMilestoneNotifications(milestoneId);
    await createCompletionCelebration(userId, goalId, {
      id: milestoneId,
      weekNumber: milestone.week_number as number,
      title: milestone.title as string,
    });

    const { data: goal } = await supabase
      .from("career_goals")
      .select("readiness_score")
      .eq("id", goalId)
      .single();

    const nextScore = Math.min(100, (goal?.readiness_score as number ?? 0) + 3);
    await supabase.from("career_goals").update({ readiness_score: nextScore }).eq("id", goalId);
  }
}

export async function completeMilestone(userId: string, milestoneId: string): Promise<void> {
  const { data: tasks, error } = await supabase
    .from("milestone_tasks")
    .select("id, status")
    .eq("milestone_id", milestoneId);

  if (error) throw error;

  const pending = (tasks ?? []).filter((t) => t.status !== "completed");
  const now = new Date().toISOString();

  if (pending.length) {
    await supabase
      .from("milestone_tasks")
      .update({ status: "completed", completed_at: now })
      .in(
        "id",
        pending.map((t) => t.id as string)
      );
  }

  await syncMilestoneProgress(userId, milestoneId);
}

export async function checkMissedMilestones(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("weekly_milestones")
    .select("*")
    .eq("user_id", userId)
    .lt("due_date", today)
    .in("status", ["not_started", "in_progress"]);

  if (error) throw error;

  for (const row of data ?? []) {
    const milestone = mapMilestone(row as Record<string, unknown>);
    await supabase
      .from("weekly_milestones")
      .update({ status: "missed" })
      .eq("id", milestone.id);

    await createMissedMilestoneNotification(userId, milestone.goalId, milestone);
  }
}

export async function extendMilestoneDueDate(
  userId: string,
  milestoneId: string,
  extraDays: number
): Promise<void> {
  const { data, error } = await supabase
    .from("weekly_milestones")
    .select("due_date, status")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  const due = new Date(`${data.due_date as string}T12:00:00`);
  due.setDate(due.getDate() + extraDays);

  await supabase
    .from("weekly_milestones")
    .update({
      due_date: due.toISOString().slice(0, 10),
      status: data.status === "missed" ? "in_progress" : data.status,
    })
    .eq("id", milestoneId);
}

export function getCurrentMilestone(milestones: WeeklyMilestone[]): WeeklyMilestone | null {
  const unlocked = milestones.filter((m) => m.isUnlocked && m.status !== "locked");
  const today = new Date().toISOString().slice(0, 10);
  const inProgress = unlocked.find((m) => m.status === "in_progress");
  if (inProgress) return inProgress;

  const activeWeek = unlocked.find(
    (m) => m.startDate <= today && m.dueDate >= today && m.status !== "completed"
  );
  if (activeWeek) return activeWeek;

  return unlocked.find((m) => m.status === "not_started") ?? null;
}

export function overallProgress(milestones: WeeklyMilestone[]): number {
  const unlocked = milestones.filter((m) => m.isUnlocked && m.status !== "locked");
  if (unlocked.length === 0) return 0;
  const sum = unlocked.reduce((acc, m) => acc + m.completionPercentage, 0);
  return Math.round(sum / unlocked.length);
}

export async function refreshTransitionState(userId: string): Promise<void> {
  await processDueNotifications(userId);
  await checkMissedMilestones(userId);
}

export async function switchActiveGoal(userId: string, newGoalId: string): Promise<CareerGoal> {
  const allowed = await canSwitchGoal(userId);
  if (!allowed) {
    throw new Error("Goal switch limit reached for this billing cycle");
  }

  const current = await fetchActiveGoal(userId);
  if (current?.id === newGoalId) return current;

  if (current) {
    const { error: pauseError } = await supabase
      .from("career_goals")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("id", current.id)
      .eq("user_id", userId);
    if (pauseError) throw pauseError;
  }

  const { data, error } = await supabase
    .from("career_goals")
    .update({ status: "active", paused_at: null })
    .eq("id", newGoalId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  await incrementGoalSwitchUsage(userId);
  return mapGoal(data as Record<string, unknown>);
}

export async function fetchXrayById(userId: string, xrayId: string) {
  const { data, error } = await supabase
    .from("career_xrays")
    .select("*")
    .eq("id", xrayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapXrayRow(data as Record<string, unknown>) : null;
}

export async function createGoalFromXray(
  userId: string,
  xrayId: string,
  planLengthWeeks: 8 | 12 = 8
): Promise<CareerGoal> {
  const existing = await fetchActiveGoal(userId);
  if (existing) {
    throw new Error("An active goal already exists. Compare or switch instead.");
  }

  const xray = await fetchXrayById(userId, xrayId);
  if (!xray || xray.status !== "generated") {
    throw new Error("Generated Career X-Ray required to start a goal");
  }

  const scan = await fetchCareerScan(userId, xray.scanId);
  if (!scan) throw new Error("Scan not found for this X-Ray");

  const payload = goalPayloadFromXray(
    userId,
    xray.scanId,
    xray.id,
    scan.currentRole,
    scan.targetRole,
    xray.result,
    planLengthWeeks
  );

  const { data: goal, error } = await supabase
    .from("career_goals")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  const mapped = mapGoal(goal as Record<string, unknown>);
  await generateAndPersistWeeklyMilestones(userId, mapped, xray.scanId);
  return mapped;
}

async function recordGoalSwitchHistory(args: {
  userId: string;
  fromGoalId: string | null;
  toGoalId: string;
  fromXrayId: string | null;
  toXrayId: string;
  reason?: string;
}): Promise<void> {
  await supabase.from("goal_switch_history").insert({
    user_id: args.userId,
    from_goal_id: args.fromGoalId,
    to_goal_id: args.toGoalId,
    from_xray_id: args.fromXrayId,
    to_xray_id: args.toXrayId,
    reason: args.reason ?? "user_switch",
  });
}

export async function switchToGoalFromXray(
  userId: string,
  xrayId: string,
  planLengthWeeks: 8 | 12 = 8
): Promise<CareerGoal> {
  const allowed = await canSwitchGoal(userId);
  if (!allowed) {
    throw new Error("Goal switch limit reached for this billing cycle");
  }

  const current = await fetchActiveGoal(userId);
  const xray = await fetchXrayById(userId, xrayId);
  if (!xray || xray.status !== "generated") {
    throw new Error("Generated Career X-Ray required to switch goals");
  }

  const scan = await fetchCareerScan(userId, xray.scanId);
  if (!scan) throw new Error("Scan not found for this X-Ray");

  if (current?.sourceXrayId === xrayId) return current;

  const now = new Date().toISOString();

  if (current) {
    const { error: pauseError } = await supabase
      .from("career_goals")
      .update({ status: "paused", paused_at: now })
      .eq("id", current.id)
      .eq("user_id", userId);
    if (pauseError) throw pauseError;
  }

  const payload = goalPayloadFromXray(
    userId,
    xray.scanId,
    xray.id,
    scan.currentRole,
    scan.targetRole,
    xray.result,
    planLengthWeeks
  );

  const { data: goal, error } = await supabase
    .from("career_goals")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  const mapped = mapGoal(goal as Record<string, unknown>);
  await generateAndPersistWeeklyMilestones(userId, mapped, xray.scanId);

  await recordGoalSwitchHistory({
    userId,
    fromGoalId: current?.id ?? null,
    toGoalId: mapped.id,
    fromXrayId: current?.sourceXrayId ?? null,
    toXrayId: xray.id,
  });

  await incrementGoalSwitchUsage(userId);
  return mapped;
}

export type ExplorationXray = {
  xrayId: string;
  scanId: string;
  targetRole: string;
  currentRole: string;
  readinessScore: number;
  generatedAt: string | null;
};

export async function fetchExplorationXrays(
  userId: string,
  activeGoal: CareerGoal | null
): Promise<ExplorationXray[]> {
  const { data: xrays, error } = await supabase
    .from("career_xrays")
    .select("id, scan_id, readiness_score, generated_at, xray_result_json, status")
    .eq("user_id", userId)
    .eq("status", "generated")
    .order("generated_at", { ascending: false });

  if (error) throw error;

  const activeXrayId = activeGoal?.sourceXrayId;

  const filtered = (xrays ?? []).filter((row) => {
    if (activeXrayId && row.id === activeXrayId) return false;
    return true;
  });

  const results: ExplorationXray[] = [];

  for (const row of filtered) {
    const scan = await fetchCareerScan(userId, row.scan_id as string);
    if (!scan) continue;
    const result = row.xray_result_json as CareerXRaySnapshotResult | null;
    results.push({
      xrayId: row.id as string,
      scanId: row.scan_id as string,
      targetRole: result?.report?.targetRole ?? scan.targetRole,
      currentRole: result?.report?.currentRole ?? scan.currentRole,
      readinessScore:
        (row.readiness_score as number | null) ??
        result?.report?.futureReadinessScore ??
        0,
      generatedAt: (row.generated_at as string | null) ?? null,
    });
  }

  return results;
}
