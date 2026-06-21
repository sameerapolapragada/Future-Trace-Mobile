import { careerScans, currentRoleScanProfile, targetRoleScanProfile } from "../data/mockData";
import { scanInputCacheKey } from "@ft/ai";
import { loadAiAccessContext } from "./ai/clientAccess";
import { apiJson, isApiConfigured } from "./apiClient";
import { supabase } from "./supabaseClient";
import { inferTargetRole } from "./targetRole";
import { recordFreeScanUsage } from "./accessService";
import type {
  AIExposureLevel,
  CareerScanRecord,
  FreeScanResult,
  RoleScanProfile,
  ScanFormInput,
} from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

type StoredScanResult = FreeScanResult & {
  industry?: string | null;
  yearsExperience?: string | null;
  skills?: string | null;
  tools?: string | null;
  careerGoal?: string | null;
  workPreference?: string | null;
};

type ScanRow = {
  id: string;
  user_id: string;
  current_role?: string | null;
  target_role?: string | null;
  industry?: string | null;
  years_experience?: string | null;
  skills?: string | null;
  tools?: string | null;
  career_goal?: string | null;
  work_preference?: string | null;
  free_result_json?: FreeScanResult | null;
  result: StoredScanResult | null;
  resilience_score: number | null;
  ai_exposure_level: string | null;
  status: string;
  input_hash: string;
  created_at: string;
  scan_inputs?: {
    job_title_raw: string;
    industry_raw: string;
    years_experience: number;
    current_skills_text: string;
    tools_used_text: string;
    career_goal_text: string;
    work_preference: string;
  } | null;
};

function formatDbError(error: PostgrestError): string {
  if (error.code === "23505") {
    return "You already ran a scan with these details. Change your inputs or wait until next week.";
  }
  if (error.code === "PGRST204") {
    return "Database schema is out of date. Apply the latest Supabase migrations and try again.";
  }
  return error.message || "Could not save scan to database";
}

function computeInputHash(input: ScanFormInput, uniqueSuffix: string): string {
  const payload = [
    input.currentRole,
    input.targetRole,
    input.industry,
    input.yearsExperience,
    input.skills,
    input.tools,
    input.careerGoal,
    input.workPreference,
    uniqueSuffix,
  ]
    .join("|")
    .toLowerCase();

  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `scan-${Math.abs(hash).toString(36)}`;
}

type LegacyFreeScanResult = {
  currentRole: string;
  targetRole: string;
  resilienceScore: number;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
  summary: string;
};

function toRoleProfile(profile: {
  resilienceScore: number;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  strengths: readonly string[];
  vulnerabilities: readonly string[];
  opportunityZones: readonly string[];
}): RoleScanProfile {
  return {
    resilienceScore: profile.resilienceScore,
    aiExposureLevel: profile.aiExposureLevel,
    aiExposureLabel: profile.aiExposureLabel,
    strengths: [...profile.strengths],
    vulnerabilities: [...profile.vulnerabilities],
    opportunityZones: [...profile.opportunityZones],
  };
}

function normalizeFreeResult(stored: StoredScanResult | LegacyFreeScanResult): FreeScanResult {
  if ("currentRoleProfile" in stored && stored.currentRoleProfile && stored.targetRoleProfile) {
    return {
      currentRole: stored.currentRole,
      targetRole: stored.targetRole,
      currentRoleProfile: stored.currentRoleProfile,
      targetRoleProfile: stored.targetRoleProfile,
      summary: stored.summary,
    };
  }

  const legacy = stored as LegacyFreeScanResult;
  return {
    currentRole: legacy.currentRole,
    targetRole: legacy.targetRole,
    currentRoleProfile: {
      resilienceScore: legacy.resilienceScore,
      aiExposureLevel: legacy.aiExposureLevel,
      aiExposureLabel: legacy.aiExposureLabel,
      strengths: legacy.strengths,
      vulnerabilities: legacy.vulnerabilities,
      opportunityZones: legacy.opportunityZones,
    },
    targetRoleProfile: toRoleProfile(targetRoleScanProfile),
    summary: legacy.summary,
  };
}

function buildMockFreeResult(input: ScanFormInput): StoredScanResult {
  const mock = careerScans[0];
  const targetRole = input.targetRole || inferTargetRole(input.careerGoal, input.currentRole);

  return {
    currentRole: input.currentRole.trim(),
    targetRole,
    industry: input.industry.trim() || null,
    yearsExperience: input.yearsExperience.trim() || null,
    skills: input.skills.trim() || null,
    tools: input.tools.trim() || null,
    careerGoal: input.careerGoal.trim() || null,
    workPreference: input.workPreference,
    currentRoleProfile: toRoleProfile(currentRoleScanProfile),
    targetRoleProfile: toRoleProfile(targetRoleScanProfile),
    summary: mock.summary,
  };
}

function mapScanRow(row: ScanRow): CareerScanRecord {
  const inputs = row.scan_inputs;
  const stored: StoredScanResult | null =
    row.free_result_json ??
    row.result ??
    (inputs
      ? buildMockFreeResult({
          currentRole: row.current_role ?? inputs.job_title_raw,
          targetRole: row.target_role ?? inferTargetRole(inputs.career_goal_text, inputs.job_title_raw),
          industry: row.industry ?? inputs.industry_raw,
          yearsExperience: row.years_experience ?? String(inputs.years_experience),
          skills: row.skills ?? inputs.current_skills_text,
          tools: row.tools ?? inputs.tools_used_text,
          careerGoal: row.career_goal ?? inputs.career_goal_text,
          workPreference: (row.work_preference ?? inputs.work_preference) as ScanFormInput["workPreference"],
        })
      : null);

  const freeResult: FreeScanResult | null = stored ? normalizeFreeResult(stored) : null;

  return {
    id: row.id,
    userId: row.user_id,
    currentRole: row.current_role ?? stored?.currentRole ?? "—",
    targetRole: row.target_role ?? stored?.targetRole ?? "—",
    industry: row.industry ?? stored?.industry ?? inputs?.industry_raw ?? null,
    yearsExperience: row.years_experience ?? stored?.yearsExperience ?? (inputs ? String(inputs.years_experience) : null),
    skills: row.skills ?? stored?.skills ?? inputs?.current_skills_text ?? null,
    tools: row.tools ?? stored?.tools ?? inputs?.tools_used_text ?? null,
    careerGoal: row.career_goal ?? stored?.careerGoal ?? inputs?.career_goal_text ?? null,
    workPreference: row.work_preference ?? stored?.workPreference ?? inputs?.work_preference ?? null,
    freeResult,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createCareerScan(
  userId: string,
  input: ScanFormInput
): Promise<CareerScanRecord> {
  const targetRole = input.targetRole.trim() || inferTargetRole(input.careerGoal, input.currentRole);
  const inputHash = computeInputHash({ ...input, targetRole }, String(Date.now()));
  const yearsNum = Math.min(60, Math.max(0, parseInt(input.yearsExperience, 10) || 0));

  const context = await loadAiAccessContext({ userId });
  const cacheKey = scanInputCacheKey(userId, inputHash);

  if (isApiConfigured()) {
    const created = await apiJson<{ scanId: string }>("/api/v1/scans", {
      method: "POST",
      body: {
        ...input,
        targetRole,
        inputHash,
        cacheKey,
        modelTier: context.plan === "free" ? "openrouter_free" : "gemini_flash",
      },
    });

    await recordFreeScanUsage(userId);

    const scan = await fetchCareerScan(userId, created.scanId);
    if (scan) return scan;

    throw new Error("Scan was created but could not be loaded.");
  }

  const freeResult = buildMockFreeResult({ ...input, targetRole });

  // Core columns only — works before optional migration columns are applied.
  const { data: scan, error: scanError } = await supabase
    .from("career_scans")
    .insert({
      user_id: userId,
      status: "complete",
      input_hash: inputHash,
      result: freeResult,
      resilience_score: freeResult.currentRoleProfile.resilienceScore,
      ai_exposure_level: freeResult.currentRoleProfile.aiExposureLevel,
      summary: freeResult.summary,
    })
    .select("*")
    .single();

  if (scanError) {
    throw new Error(formatDbError(scanError));
  }

  const { error: inputsError } = await supabase.from("scan_inputs").insert({
    scan_id: scan.id,
    job_title_raw: input.currentRole.trim(),
    industry_raw: input.industry.trim() || "General",
    years_experience: yearsNum,
    current_skills_text: input.skills.trim() || "—",
    tools_used_text: input.tools.trim() || "—",
    career_goal_text: input.careerGoal.trim() || targetRole,
    work_preference: input.workPreference.toLowerCase(),
  });

  if (inputsError) {
    throw new Error(formatDbError(inputsError));
  }

  await Promise.all([
    ...freeResult.currentRoleProfile.strengths.map((label, i) =>
      supabase.from("scan_strengths").insert({ scan_id: scan.id, label, sort_order: i })
    ),
    ...freeResult.currentRoleProfile.vulnerabilities.map((label, i) =>
      supabase.from("scan_vulnerabilities").insert({ scan_id: scan.id, label, sort_order: i })
    ),
    ...freeResult.currentRoleProfile.opportunityZones.map((label, i) =>
      supabase.from("scan_opportunity_zones").insert({ scan_id: scan.id, label, sort_order: i })
    ),
  ]);

  try {
    await recordFreeScanUsage(userId);
  } catch {
    // Non-fatal if usage_limits table is not migrated yet.
  }

  return mapScanRow(scan as ScanRow);
}

export async function fetchCareerScan(userId: string, scanId: string): Promise<CareerScanRecord | null> {
  const { data, error } = await supabase
    .from("career_scans")
    .select(
      "*, scan_inputs (job_title_raw, industry_raw, years_experience, current_skills_text, tools_used_text, career_goal_text, work_preference)"
    )
    .eq("user_id", userId)
    .eq("id", scanId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapScanRow(data as ScanRow) : null;
}

export async function fetchUserScans(userId: string): Promise<CareerScanRecord[]> {
  const { data, error } = await supabase
    .from("career_scans")
    .select(
      "*, scan_inputs (job_title_raw, industry_raw, years_experience, current_skills_text, tools_used_text, career_goal_text, work_preference)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapScanRow(row as ScanRow));
}

export function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type { ScanFormInput };
