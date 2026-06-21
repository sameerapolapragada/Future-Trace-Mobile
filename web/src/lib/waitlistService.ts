import type { WaitlistEntry } from "../../../lib/shared";
import { supabase } from "./supabaseClient";

export async function submitWaitlistEntry(entry: WaitlistEntry): Promise<void> {
  const email = entry.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const { error } = await supabase.from("career_xray_waitlist").insert({
    email,
    current_role: entry.currentRole?.trim() || null,
    target_role: entry.targetRole?.trim() || null,
    source: entry.source ?? "web_app",
  });

  if (error && error.code !== "23505") throw new Error(error.message);
}
