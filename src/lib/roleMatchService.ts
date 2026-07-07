import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  matchRole,
  normalizeRoleInputForTracking,
  shouldTrackUnknownRole,
  type RoleMatchInput,
  type RoleMatchResult,
  type RoleMatchUserAction,
} from "../../lib/shared";
import type { RoleMatchSnapshot } from "../../lib/shared";
import { getSupabase, isSupabaseConfigured } from "./waitlistService";

const ROLE_MATCH_EVENTS_KEY = "ft_role_match_events_v1";
const UNKNOWN_ROLES_KEY = "ft_unknown_role_requests_v1";

export type StoredRoleMatchEvent = RoleMatchSnapshot & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

function newLocalId(): string {
  return `rme_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toSnapshot(result: RoleMatchResult, eventId?: string, userAction?: RoleMatchUserAction): RoleMatchSnapshot {
  return {
    roleMatchEventId: eventId ?? result.roleMatchEventId,
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
    userAction,
  };
}

async function persistLocalEvent(snapshot: RoleMatchSnapshot): Promise<StoredRoleMatchEvent> {
  const now = new Date().toISOString();
  const event: StoredRoleMatchEvent = {
    ...snapshot,
    id: snapshot.roleMatchEventId ?? newLocalId(),
    createdAt: now,
    updatedAt: now,
  };

  const raw = await AsyncStorage.getItem(ROLE_MATCH_EVENTS_KEY);
  const events: StoredRoleMatchEvent[] = raw ? (JSON.parse(raw) as StoredRoleMatchEvent[]) : [];
  events.unshift(event);
  await AsyncStorage.setItem(ROLE_MATCH_EVENTS_KEY, JSON.stringify(events.slice(0, 100)));

  if (shouldTrackUnknownRole(snapshot.matchStatus)) {
    await upsertLocalUnknownRole(snapshot);
  }

  return event;
}

async function upsertLocalUnknownRole(snapshot: RoleMatchSnapshot): Promise<void> {
  const normalized = normalizeRoleInputForTracking(snapshot.originalRoleInput);
  const raw = await AsyncStorage.getItem(UNKNOWN_ROLES_KEY);
  const rows = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
  const existing = rows.find((r) => r.normalized_role_input === normalized);

  if (existing) {
    existing.times_requested = ((existing.times_requested as number) ?? 1) + 1;
    existing.last_seen = new Date().toISOString();
  } else {
    rows.unshift({
      role_input: snapshot.originalRoleInput,
      normalized_role_input: normalized,
      match_status: snapshot.matchStatus,
      suggested_family: snapshot.roleFamily,
      times_requested: 1,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      status: "pending",
    });
  }

  await AsyncStorage.setItem(UNKNOWN_ROLES_KEY, JSON.stringify(rows.slice(0, 200)));
}

/** Run role match locally and persist event — always creates a record. */
export async function runRoleMatch(input: RoleMatchInput): Promise<RoleMatchSnapshot> {
  const result = matchRole(input);
  const event = await persistLocalEvent(toSnapshot(result));
  return toSnapshot(result, event.id);
}

/** Optionally sync to Supabase edge function when configured with authenticated user. */
export async function runRoleMatchRemote(
  userId: string,
  input: RoleMatchInput
): Promise<RoleMatchSnapshot | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

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

  if (error || !data) return null;

  const snapshot = toSnapshot({
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
  });

  await persistLocalEvent(snapshot);
  return snapshot;
}

export async function updateRoleMatchUserAction(
  eventId: string,
  userAction: RoleMatchUserAction,
  updates?: {
    userSelectedRole?: string;
    addedResponsibilities?: string;
    addedTools?: string;
    addedIndustry?: string;
  }
): Promise<void> {
  const raw = await AsyncStorage.getItem(ROLE_MATCH_EVENTS_KEY);
  if (!raw) return;

  const events = JSON.parse(raw) as StoredRoleMatchEvent[];
  const idx = events.findIndex((e) => e.id === eventId || e.roleMatchEventId === eventId);
  if (idx < 0) return;

  events[idx] = {
    ...events[idx]!,
    userAction,
    userSelectedRole: updates?.userSelectedRole ?? events[idx]!.userSelectedRole,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(ROLE_MATCH_EVENTS_KEY, JSON.stringify(events));

  const supabase = getSupabase();
  if (supabase && events[idx]!.roleMatchEventId?.startsWith?.("rme_") === false) {
    await supabase
      .from("role_match_events")
      .update({
        user_action: userAction,
        user_selected_role: updates?.userSelectedRole ?? null,
        added_responsibilities: updates?.addedResponsibilities ?? null,
        added_tools: updates?.addedTools ?? null,
        added_industry: updates?.addedIndustry ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", events[idx]!.roleMatchEventId);
  }
}

export async function listLocalUnknownRoles(): Promise<
  {
    role_input: string;
    normalized_role_input: string;
    times_requested: number;
    match_status: string;
    suggested_family: string | null;
    first_seen: string;
    last_seen: string;
    status: string;
  }[]
> {
  const raw = await AsyncStorage.getItem(UNKNOWN_ROLES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Awaited<ReturnType<typeof listLocalUnknownRoles>>;
  } catch {
    return [];
  }
}
