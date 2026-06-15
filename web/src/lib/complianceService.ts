import { supabase } from "./supabaseClient";

export type ComplianceAction = "DATA_EXPORT" | "ACCOUNT_DELETION_REQUESTED";

export async function logComplianceEvent(action: ComplianceAction): Promise<void> {
  const { error } = await supabase.rpc("log_compliance_event", { p_action: action });
  if (error) throw error;
}

export type UserDataExport = Record<string, unknown>;

export async function exportUserData(): Promise<UserDataExport> {
  const { data, error } = await supabase.rpc("export_user_data");
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Export returned no data");
  }
  return data as UserDataExport;
}

export function downloadJsonExport(data: UserDataExport, userId: string): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `future-trace-export-${userId.slice(0, 8)}-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
