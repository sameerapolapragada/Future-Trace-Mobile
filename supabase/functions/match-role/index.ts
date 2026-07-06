import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { matchRole, normalizeRoleInputForTracking, shouldTrackUnknownRole } from "../_shared/roleMatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MatchRoleRequest = {
  user_id: string;
  original_role_input: string;
  industry?: string;
  years_experience?: number;
  skills?: string;
  tools?: string;
  responsibilities?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as MatchRoleRequest;
    const userId = body.user_id?.trim();
    const originalRoleInput = body.original_role_input?.trim();

    if (!userId || !originalRoleInput) {
      return new Response(JSON.stringify({ error: "user_id and original_role_input are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const match = matchRole({
      originalRoleInput,
      industry: body.industry,
      yearsExperience: body.years_experience,
      skills: body.skills,
      tools: body.tools,
      responsibilities: body.responsibilities,
    });

    const { data: eventRow, error: insertError } = await supabase
      .from("role_match_events")
      .insert({
        user_id: userId,
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
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (shouldTrackUnknownRole(match.matchStatus)) {
      const normalized = normalizeRoleInputForTracking(originalRoleInput);
      const { error: trackError } = await supabase.rpc("upsert_unknown_role_request", {
        p_role_input: originalRoleInput,
        p_normalized_role_input: normalized,
        p_match_status: match.matchStatus,
        p_suggested_family: match.roleFamily,
        p_example_user_id: userId,
      });

      if (trackError) {
        console.error("unknown_role_requests upsert failed:", trackError.message);
      }
    }

    const response = {
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
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
