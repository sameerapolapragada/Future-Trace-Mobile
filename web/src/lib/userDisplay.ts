import type { User } from "@supabase/supabase-js";

export function getDisplayName(
  user: User | null,
  profile?: { display_name?: string | null; full_name?: string | null } | null
): string {
  const fromProfile = profile?.display_name?.trim() || profile?.full_name?.trim();
  if (fromProfile) return fromProfile;

  const fromMeta = user?.user_metadata?.full_name as string | undefined;
  if (fromMeta?.trim()) return fromMeta.trim();

  const emailPrefix = user?.email?.split("@")[0];
  if (emailPrefix) return emailPrefix;

  return "User";
}

export function getFirstName(user: User | null, profile?: { display_name?: string | null; full_name?: string | null } | null): string {
  const raw = getDisplayName(user, profile).split(/\s+/)[0] ?? "User";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
