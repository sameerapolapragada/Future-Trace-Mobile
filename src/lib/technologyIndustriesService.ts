import { SUPPORTED_INDUSTRY_OPTIONS } from "../../lib/shared";
import { getSupabase, isSupabaseConfigured } from "./waitlistService";

/** Load active industries from Supabase; fall back to the local curated catalog. */
export async function fetchTechnologyIndustries(): Promise<string[]> {
  const fallback = [...SUPPORTED_INDUSTRY_OPTIONS];

  if (!isSupabaseConfigured()) return fallback;

  const supabase = getSupabase();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("technology_industries")
      .select("canonical_name")
      .eq("active", true)
      .order("canonical_name", { ascending: true });

    if (error || !data?.length) return fallback;

    const names = data
      .map((row) => (row.canonical_name as string | null)?.trim())
      .filter((name): name is string => !!name);

    return names.length > 0 ? names : fallback;
  } catch {
    return fallback;
  }
}

/** Record an industry picklist selection. Fire-and-forget — never throws to UI. */
export async function recordTechnologyIndustrySelection(industry: string): Promise<void> {
  const trimmed = industry.trim();
  if (!trimmed) return;
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.rpc("record_technology_industry_selection", {
      p_canonical_name: trimmed,
    });
  } catch {
    // Analytics should never block scan flow.
  }
}
