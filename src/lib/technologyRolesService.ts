import {
  isOtherRoleSelection,
  TECHNOLOGY_CURRENT_ROLES,
  type RoleMatchSnapshot,
} from "../../lib/shared";
import { getSupabase, isSupabaseConfigured } from "./waitlistService";

/** Load active technology roles from Supabase; fall back to the local curated catalog. */
export async function fetchTechnologyJobRoles(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [...TECHNOLOGY_CURRENT_ROLES];
  }

  const supabase = getSupabase();
  if (!supabase) return [...TECHNOLOGY_CURRENT_ROLES];

  try {
    const { data, error } = await supabase
      .from("technology_job_roles")
      .select("canonical_name")
      .eq("active", true)
      .order("canonical_name", { ascending: true });

    if (error || !data?.length) {
      return [...TECHNOLOGY_CURRENT_ROLES];
    }

    const names = data
      .map((row) => (row.canonical_name as string | null)?.trim())
      .filter((name): name is string => !!name);

    return names.length > 0 ? names : [...TECHNOLOGY_CURRENT_ROLES];
  } catch {
    return [...TECHNOLOGY_CURRENT_ROLES];
  }
}

/**
 * Record a picklist selection (and optional Other free-text) in Supabase.
 * Fire-and-forget safe — never throws to the UI path.
 */
export async function recordTechnologyJobRoleSelection(input: {
  selectedPicklistValue: string;
  roleInputForMatch: string;
  match?: RoleMatchSnapshot | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const isOther = isOtherRoleSelection(input.selectedPicklistValue);
  let canonicalName: string | null = null;
  let otherRoleInput: string | null = null;

  if (isOther) {
    otherRoleInput = input.roleInputForMatch.trim() || null;
    const matched = input.match?.normalizedRole?.trim();
    const usableMatch =
      !!matched &&
      !input.match?.outOfTechnologyDomain &&
      (input.match?.matchStatus === "matched" || input.match?.matchStatus === "partial_match");
    if (usableMatch) {
      canonicalName = matched;
    }
  } else {
    canonicalName = input.selectedPicklistValue.trim() || null;
  }

  if (!canonicalName && !otherRoleInput) return;

  try {
    await supabase.rpc("record_technology_job_role_selection", {
      p_canonical_name: canonicalName,
      p_other_role_input: otherRoleInput,
    });
  } catch {
    // Analytics should never block scan flow.
  }
}
