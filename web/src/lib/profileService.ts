import { supabase } from "./supabaseClient";

export type UserProfileRecord = {
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  job_role: string | null;
};

export type SavedScanSummary = {
  id: string;
  title: string;
  role: string;
  date: string;
  resilienceScore: number | null;
  aiExposure: number | null;
  aiExposureLevel: string | null;
  status: string;
};

type ScanInputsJoin = {
  job_title_raw: string;
  industry_raw: string;
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
  return {
    id: row.id,
    title: inputs?.job_title_raw ?? "Career Scan",
    role: inputs?.industry_raw ?? "—",
    date: formatScanDate(row.created_at),
    resilienceScore: row.resilience_score,
    aiExposure: row.ai_exposure_score,
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
      "id, status, resilience_score, ai_exposure_score, ai_exposure_level, created_at, scan_inputs (job_title_raw, industry_raw)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapScanRow);
}
