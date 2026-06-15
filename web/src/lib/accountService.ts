import { apiJson, isApiConfigured } from "./apiClient";
import { logComplianceEvent } from "./complianceService";

export async function deleteAccount(): Promise<void> {
  if (!isApiConfigured()) {
    throw new Error(
      "Account deletion is unavailable until the API is configured. Set VITE_API_BASE_URL for production."
    );
  }

  await logComplianceEvent("ACCOUNT_DELETION_REQUESTED");
  await apiJson<{ ok: true }>("/api/v1/me/delete", { method: "POST" });
}
