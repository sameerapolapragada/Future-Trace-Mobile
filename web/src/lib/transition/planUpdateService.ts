import { supabase } from "../supabaseClient";
import type {
  MilestoneVersion,
  PlanUpdateRecommendation,
  ProposedChanges,
} from "../../types/transition";

function mapRecommendation(
  row: Record<string, unknown>,
  signal?: Record<string, unknown> | null,
  target?: Record<string, unknown> | null
): PlanUpdateRecommendation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    goalId: row.goal_id as string,
    signalId: (row.signal_id as string | null) ?? null,
    recommendationType: row.recommendation_type as PlanUpdateRecommendation["recommendationType"],
    title: row.title as string,
    summary: row.summary as string,
    whyItMatters: row.why_it_matters as string,
    expectedImpact: (row.expected_impact as string | null) ?? null,
    targetMilestoneId: (row.target_milestone_id as string | null) ?? null,
    proposedChanges: (row.proposed_changes_json as ProposedChanges) ?? {},
    status: row.status as PlanUpdateRecommendation["status"],
    createdAt: row.created_at as string,
    appliedAt: (row.applied_at as string | null) ?? null,
    dismissedAt: (row.dismissed_at as string | null) ?? null,
    signalSkillName: (signal?.skill_name as string | null) ?? null,
    signalSummary: (signal?.signal_summary as string | null) ?? null,
    targetWeekNumber: (target?.week_number as number | null) ?? null,
    targetMonthNumber: (target?.unlock_month_number as number | null) ?? null,
    targetPreviewTitle: (target?.locked_preview_title as string | null) ?? null,
    targetIsUnlocked: target?.is_unlocked !== false,
  };
}

export async function refreshMarketSignals(role: string, industry?: string): Promise<number> {
  const { data, error } = await supabase.rpc("refresh_career_market_signals", {
    p_role: role,
    p_industry: industry ?? null,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function checkPlanUpdatesForGoal(goalId: string): Promise<number> {
  const { data, error } = await supabase.rpc("check_plan_updates_for_goal", {
    p_goal_id: goalId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function fetchPendingPlanUpdates(userId: string, goalId: string): Promise<PlanUpdateRecommendation[]> {
  const { data, error } = await supabase
    .from("plan_update_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingPlanUpdatesTable(error)) return [];
    throw error;
  }

  const rows = data ?? [];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const r = row as Record<string, unknown>;
      const [signal, target] = await Promise.all([
        fetchSignalSummary(r.signal_id as string | null),
        fetchTargetMilestonePreview(r.target_milestone_id as string | null),
      ]);
      return mapRecommendation(r, signal, target);
    })
  );

  return enriched;
}

export async function fetchPlanUpdateDetail(
  userId: string,
  recommendationId: string
): Promise<PlanUpdateRecommendation | null> {
  const { data, error } = await supabase
    .from("plan_update_recommendations")
    .select("*")
    .eq("id", recommendationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingPlanUpdatesTable(error)) return null;
    throw error;
  }
  if (!data) return null;

  const r = data as Record<string, unknown>;
  const [signal, target] = await Promise.all([
    fetchSignalSummary(r.signal_id as string | null),
    fetchTargetMilestonePreview(r.target_milestone_id as string | null),
  ]);
  return mapRecommendation(r, signal, target);
}

function isMissingPlanUpdatesTable(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    message.includes("plan_update_recommendations") ||
    message.includes("career_market_signals")
  );
}

async function fetchSignalSummary(signalId: string | null): Promise<Record<string, unknown> | null> {
  if (!signalId) return null;
  const { data, error } = await supabase
    .from("career_market_signals")
    .select("skill_name, signal_summary")
    .eq("id", signalId)
    .maybeSingle();
  if (error) return null;
  return (data as Record<string, unknown> | null) ?? null;
}

async function fetchTargetMilestonePreview(
  milestoneId: string | null
): Promise<Record<string, unknown> | null> {
  if (!milestoneId) return null;
  const { data, error } = await supabase
    .from("weekly_milestones")
    .select("week_number, unlock_month_number, locked_preview_title, is_unlocked")
    .eq("id", milestoneId)
    .maybeSingle();
  if (error) return null;
  return (data as Record<string, unknown> | null) ?? null;
}

export async function applyPlanUpdate(recommendationId: string): Promise<void> {
  const { error } = await supabase.rpc("apply_plan_update", {
    p_recommendation_id: recommendationId,
  });
  if (error) throw error;
}

export async function dismissPlanUpdate(recommendationId: string): Promise<void> {
  const { error } = await supabase.rpc("dismiss_plan_update", {
    p_recommendation_id: recommendationId,
  });
  if (error) throw error;
}

export async function fetchMilestoneVersions(milestoneId: string): Promise<MilestoneVersion[]> {
  const { data, error } = await supabase
    .from("milestone_versions")
    .select("*")
    .eq("milestone_id", milestoneId)
    .order("version_number", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    milestoneId: row.milestone_id as string,
    goalId: row.goal_id as string,
    versionNumber: row.version_number as number,
    previousContent: row.previous_content_json as Record<string, unknown>,
    newContent: row.new_content_json as Record<string, unknown>,
    changeReason: row.change_reason as string,
    createdAt: row.created_at as string,
  }));
}
