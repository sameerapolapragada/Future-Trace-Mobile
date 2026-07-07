import { matchRole, type RoleMatchInput, type RoleMatchSnapshot } from "../../../lib/shared";
import { supabase } from "./supabaseClient";

export type { RoleMatchSnapshot };

export async function runRoleMatch(userId: string | undefined, input: RoleMatchInput): Promise<RoleMatchSnapshot> {
  if (userId && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke("match-role", {
        body: {
          original_role_input: input.originalRoleInput,
          industry: input.industry,
          years_experience: input.yearsExperience,
          skills: input.skills,
          tools: input.tools,
          responsibilities: input.responsibilities,
        },
      });

      if (!error && data) {
        return {
          roleMatchEventId: data.role_match_event_id,
          originalRoleInput: data.original_role_input,
          normalizedRole: data.normalized_role,
          roleFamily: data.role_family,
          matchStatus: data.match_status,
          confidenceScore: data.confidence_score,
          confidenceLabel: data.confidence_label,
          suggestedRoles: data.suggested_roles ?? [],
          needsMoreInfo: data.needs_more_info,
          analysisQuality: data.analysis_quality,
          genericResultFlag: false,
        };
      }
    } catch {
      // fall through to local match
    }
  }

  const result = matchRole(input);
  return {
    roleMatchEventId: undefined,
    originalRoleInput: result.originalRoleInput,
    normalizedRole: result.normalizedRole,
    roleFamily: result.roleFamily,
    matchStatus: result.matchStatus,
    confidenceScore: result.confidenceScore,
    confidenceLabel: result.confidenceLabel,
    suggestedRoles: result.suggestedRoles,
    needsMoreInfo: result.needsMoreInfo,
    analysisQuality: result.analysisQuality,
    genericResultFlag: result.genericResultFlag,
  };
}

export async function updateRoleMatchUserAction(
  eventId: string,
  userAction: RoleMatchSnapshot["userAction"],
  updates?: {
    userSelectedRole?: string;
    addedResponsibilities?: string;
    addedTools?: string;
  }
): Promise<void> {
  if (!supabase || !eventId) return;

  await supabase
    .from("role_match_events")
    .update({
      user_action: userAction,
      user_selected_role: updates?.userSelectedRole ?? null,
      added_responsibilities: updates?.addedResponsibilities ?? null,
      added_tools: updates?.addedTools ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

export async function fetchUnknownRolesAdmin(): Promise<
  {
    role_input: string;
    times_requested: number;
    match_status: string;
    suggested_family: string | null;
    first_seen: string;
    last_seen: string;
    status: string;
  }[]
> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("unknown_role_requests")
    .select("role_input, times_requested, match_status, suggested_family, first_seen, last_seen, status")
    .order("times_requested", { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data;
}
