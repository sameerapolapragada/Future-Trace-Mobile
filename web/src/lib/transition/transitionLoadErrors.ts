import type { PostgrestError } from "@supabase/supabase-js";

export function formatTransitionLoadError(err: unknown): string {
  const message = extractErrorMessage(err);

  if (message.includes("subscription required")) {
    return "Your AI Career Transition subscription is not active. Open Profile to confirm your plan, or upgrade again.";
  }

  if (message.includes("not authenticated")) {
    return "Please log in again to view your transition plan.";
  }

  if (
    message.includes("get_visible_milestones") ||
    message.includes("function") ||
    message.includes("does not exist")
  ) {
    return "Transition plan services are not available yet. Apply the latest database migrations (supabase db push) and refresh.";
  }

  if (message.includes("career_goals") && message.includes("does not exist")) {
    return "Transition plan tables are missing. Run supabase db push, then refresh this page.";
  }

  return message || "Failed to load transition plan";
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as PostgrestError).message);
  }
  return "";
}
