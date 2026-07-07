import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { matchRole, normalizeRoleInputForTracking, shouldTrackUnknownRole } from "../_shared/roleMatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MatchRoleRequest = {
  original_role_input: string;
  industry?: string;
  years_experience?: number;
  skills?: string;
  tools?: string;
  responsibilities?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const body = (await req.json()) as MatchRoleRequest;
    const originalRoleInput = body.original_role_input?.trim();

    if (!originalRoleInput) {
      return jsonResponse({ error: "original_role_input is required" }, 400);
    }

    const match = matchRole({
      originalRoleInput,
      industry: body.industry,
      yearsExperience: body.years_experience,
      skills: body.skills,
      tools: body.tools,
      responsibilities: body.responsibilities,
    });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: eventRow, error: insertError } = await supabase
      .from("role_match_events")
      .insert({
        user_id: user.id,
        original_role_input: match.originalRoleInput,
        normalized_role: match.normalizedRole,
        role_family: match.roleFamily,
        match_status: match.matchStatus,
        confidence_score: match.confidenceScore,
        confidence_label: match.confidenceLabel,
        suggested_roles_json: match.suggestedRoles,
        needs_more_info: match.needsMoreInfo,
        analysis_quality: match.analysisQuality,
        generic_result_flag: match.genericResultFlag,
        added_industry: body.industry ?? null,
        added_tools: body.tools ?? null,
        added_responsibilities: body.responsibilities ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    if (shouldTrackUnknownRole(match.matchStatus)) {
      const normalized = normalizeRoleInputForTracking(originalRoleInput);
      const { error: trackError } = await supabase.rpc("upsert_unknown_role_request", {
        p_role_input: originalRoleInput,
        p_normalized_role_input: normalized,
        p_match_status: match.matchStatus,
        p_suggested_family: match.roleFamily,
        p_example_user_id: user.id,
      });

      if (trackError) {
        console.error("unknown_role_requests upsert failed:", trackError.message);
      }
    }

    return jsonResponse({
      role_match_event_id: eventRow.id,
      original_role_input: match.originalRoleInput,
      normalized_role: match.normalizedRole,
      role_family: match.roleFamily,
      match_status: match.matchStatus,
      confidence_score: match.confidenceScore,
      confidence_label: match.confidenceLabel,
      suggested_roles: match.suggestedRoles,
      needs_more_info: match.needsMoreInfo,
      analysis_quality: match.analysisQuality,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
