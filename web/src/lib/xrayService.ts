import { careerOpportunities, xrayCompleteReport } from "../data/mockData";
import { apiJson, isApiConfigured } from "./apiClient";
import { mapXrayRow } from "./accessService";
import { denormalizedMetricsFromResult } from "./goalComparisonService";
import {
  canGenerateCareerXray,
  incrementCareerXrayUsage,
  isTransitionSubscriber,
} from "./subscriptionUsageService";
import { fetchCareerScan } from "./scanService";
import { supabase } from "./supabaseClient";
import type {
  CareerOpportunitiesReport,
  CareerXrayRecord,
  CareerXRaySnapshotResult,
  XRayCompleteReport,
} from "../types";

function buildMockXrayResult(scan: {
  currentRole: string;
  targetRole: string;
}): CareerXRaySnapshotResult {
  const report: XRayCompleteReport = {
    ...xrayCompleteReport,
    currentRole: scan.currentRole,
    targetRole: scan.targetRole,
  };
  return { report, opportunities: careerOpportunities };
}

export async function createPendingXrayPurchase(
  userId: string,
  scanId: string
): Promise<CareerXrayRecord> {
  const { data, error } = await supabase
    .from("career_xrays")
    .insert({
      scan_id: scanId,
      user_id: userId,
      access_type: "one_time_purchase",
      status: "pending_payment",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await supabase
        .from("career_xrays")
        .select("*")
        .eq("scan_id", scanId)
        .eq("user_id", userId)
        .single();
      if (existing.data) return mapXrayRow(existing.data);
    }
    throw error;
  }

  return mapXrayRow(data);
}

export async function ensureRadarXray(userId: string, scanId: string): Promise<CareerXrayRecord> {
  const { data: existing } = await supabase
    .from("career_xrays")
    .select("*")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return mapXrayRow(existing);

  const { data, error } = await supabase
    .from("career_xrays")
    .insert({
      scan_id: scanId,
      user_id: userId,
      access_type: "radar_subscription",
      status: "paid",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapXrayRow(data);
}

export async function generateCareerXray(
  userId: string,
  scanId: string
): Promise<CareerXrayRecord> {
  const scan = await fetchCareerScan(userId, scanId);
  if (!scan) throw new Error("Scan not found");

  const isSubscriber = await isTransitionSubscriber(userId);
  const xrayRow = await supabase
    .from("career_xrays")
    .select("*")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .maybeSingle();

  let xray: CareerXrayRecord;
  if (!xrayRow.data) {
    const allowed = await canGenerateCareerXray(userId, scanId);
    if (!allowed) throw new Error("Career X-Ray limit reached or payment required");
    if (isSubscriber) {
      xray = await ensureRadarXray(userId, scanId);
    } else {
      throw new Error("Career X-Ray not purchased for this scan");
    }
  } else {
    xray = mapXrayRow(xrayRow.data as Record<string, unknown>);
  }
  if (xray.status === "generated" && xray.result) return xray;

  const canGenerate = await canGenerateCareerXray(userId, scanId);
  if (!canGenerate && xray.status !== "paid") {
    throw new Error("Payment required before generating Career X-Ray");
  }

  if (isApiConfigured()) {
    try {
      await apiJson("/api/v1/xray/generate", {
        method: "POST",
        body: { scanId },
      });
      const refreshed = await supabase
        .from("career_xrays")
        .select("*")
        .eq("id", xray.id)
        .single();
      if (refreshed.data?.status === "generated") {
        const generated = mapXrayRow(refreshed.data);
        await maybeIncrementXrayUsage(userId, isSubscriber, generated);
        return generated;
      }
    } catch {
      // Dev fallback below
    }
  }

  const result = buildMockXrayResult(scan);
  const now = new Date().toISOString();

  const denorm = denormalizedMetricsFromResult(result);

  const { data, error } = await supabase
    .from("career_xrays")
    .update({
      status: "generated",
      xray_result_json: result,
      generated_at: now,
      readiness_score: denorm.readinessScore,
      transition_difficulty: denorm.transitionDifficulty,
      estimated_transition_time: denorm.estimatedTransitionTime,
      salary_upside: denorm.salaryUpside,
      market_demand: denorm.marketDemand,
    })
    .eq("id", xray.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  const generated = mapXrayRow(data);
  await maybeIncrementXrayUsage(userId, isSubscriber, generated);
  return generated;
}

async function maybeIncrementXrayUsage(
  userId: string,
  isSubscriber: boolean,
  xray: CareerXrayRecord
): Promise<void> {
  if (isSubscriber && xray.accessType !== "one_time_purchase") {
    await incrementCareerXrayUsage(userId);
  }
}

export function getXraySummaryMetrics(result: CareerXRaySnapshotResult | null): {
  readiness: string;
  difficulty: string;
  transitionTime: string;
  salaryUpside: string;
} {
  const report = result?.report;
  if (!report) {
    return { readiness: "—", difficulty: "—", transitionTime: "—", salaryUpside: "—" };
  }
  return {
    readiness: `${report.futureReadinessScore}/100`,
    difficulty: report.transitionDifficulty,
    transitionTime: report.estimatedTransitionTime,
    salaryUpside: report.salaryUpside,
  };
}

export type { CareerOpportunitiesReport };
