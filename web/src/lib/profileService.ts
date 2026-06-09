import { inferTargetRole, formatRoleLabel } from "./targetRole";
import { supabase } from "./supabaseClient";

export type UserProfileRecord = {
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  job_role: string | null;
};

export type SavedScanSummary = {
  id: string;
  currentRole: string;
  targetRole: string;
  date: string;
  resilienceScore: number | null;
  aiExposureScore: number | null;
  aiExposureLevel: string | null;
  status: string;
};

type ScanInputsJoin = {
  job_title_raw: string;
  industry_raw: string;
  career_goal_text: string;
};

type CareerScanRow = {
  id: string;
  status: string;
  resilience_score: number | null;
  ai_exposure_score: number | null;
  ai_exposure_level: string | null;
  created_at: string;
  scan_inputs: ScanInputsJoin | ScanInputsJoin[] | null;
};

function exposureScoreFromLevel(level: string | null): number | null {
  if (!level) return null;
  const normalized = level.toLowerCase();
  if (normalized === "low") return 35;
  if (normalized === "high") return 82;
  return 62;
}

function getScanInputs(row: CareerScanRow): ScanInputsJoin | null {
  if (!row.scan_inputs) return null;
  return Array.isArray(row.scan_inputs) ? (row.scan_inputs[0] ?? null) : row.scan_inputs;
}

function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapScanRow(row: CareerScanRow): SavedScanSummary {
  const inputs = getScanInputs(row);
  const targetRole = formatRoleLabel(
    inferTargetRole(inputs?.career_goal_text ?? "", "Not specified")
  );

  return {
    id: row.id,
    currentRole: formatRoleLabel(inputs?.job_title_raw ?? "Career Scan"),
    targetRole,
    date: formatScanDate(row.created_at),
    resilienceScore: row.resilience_score,
    aiExposureScore: row.ai_exposure_score ?? exposureScoreFromLevel(row.ai_exposure_level),
    aiExposureLevel: row.ai_exposure_level,
    status: row.status,
  };
}

export async function fetchUserProfile(userId: string): Promise<UserProfileRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, full_name, email, job_role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchSavedScans(userId: string): Promise<SavedScanSummary[]> {
  const { data, error } = await supabase
    .from("career_scans")
    .select(
      "id, status, resilience_score, ai_exposure_score, ai_exposure_level, created_at, scan_inputs (job_title_raw, industry_raw, career_goal_text)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapScanRow);
}

/** DB scans for home past-scans section. */
export async function fetchPastScans(userId: string | null): Promise<SavedScanSummary[]> {
  if (!userId) return [];
  return fetchSavedScans(userId);
}
