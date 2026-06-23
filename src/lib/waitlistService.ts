import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import type { WaitlistEntry } from "../../lib/shared";

let client: SupabaseClient | null = null;

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  if (extra?.[key]) return extra[key];

  if (key === "supabaseUrl") {
    return process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  }
  if (key === "supabaseAnonKey") {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  }

  return process.env[key];
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = readExtra("supabaseUrl");
  const anonKey = readExtra("supabaseAnonKey");
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

export type WaitlistSubmitResult = { ok: true } | { ok: false; message: string };

/** Submits waitlist entry without throwing — safe for MVP offline / misconfigured builds. */
export async function submitWaitlistEntrySafe(entry: WaitlistEntry): Promise<WaitlistSubmitResult> {
  const email = entry.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const currentRole = entry.currentRole?.trim() ?? "";
  const targetRole = entry.targetRole?.trim() ?? "";
  if (!currentRole) {
    return { ok: false, message: "Enter your current role." };
  }
  if (!targetRole) {
    return { ok: false, message: "Enter your target role." };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Early access signup is temporarily unavailable. Your details are saved on this device.",
    };
  }

  try {
    const { error } = await supabase.from("career_xray_waitlist").insert({
      email,
      current_role: currentRole,
      target_role: targetRole,
      source: entry.source ?? "ios_app",
    });

    if (error && error.code !== "23505") {
      return {
        ok: false,
        message: "We couldn't submit your request right now. Your details are saved on this device.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "We couldn't reach the server. Your details are saved on this device.",
    };
  }
}
