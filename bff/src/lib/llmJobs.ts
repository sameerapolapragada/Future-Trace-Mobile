import { serviceRoleClient } from "./supabaseRest.ts";

export type LlmJobInput = {
  jobType: "career_scan" | "xray" | "role_intel" | "radar_refresh";
  userId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  model: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  status?: "queued" | "processing" | "complete" | "failed";
  errorMessage?: string;
  rawResponse?: unknown;
};

export async function logLlmJob(input: LlmJobInput): Promise<string | null> {
  const admin = serviceRoleClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("llm_jobs")
    .insert({
      job_type: input.jobType,
      user_id: input.userId,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      model: input.model,
      prompt_version: input.promptVersion ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      status: input.status ?? "complete",
      error_message: input.errorMessage ?? null,
      raw_response: input.rawResponse ?? null,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[bff] llm_jobs insert failed:", error.message);
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}
