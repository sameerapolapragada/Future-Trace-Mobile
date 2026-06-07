import type { AuthResponse, User } from "@supabase/supabase-js";

export function isEmailConfirmed(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

export function signUpNeedsEmailConfirmation(data: AuthResponse["data"]): boolean {
  if (!data.user || data.session) return false;
  return !isEmailConfirmed(data.user);
}

export function isEmailNotConfirmedError(message: string): boolean {
  return message.toLowerCase().includes("email not confirmed");
}
