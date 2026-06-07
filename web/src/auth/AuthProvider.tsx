import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Provider, Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { isEmailConfirmed, signUpNeedsEmailConfirmation } from "./authUtils";

export type SignUpResult = {
  error: AuthError | null;
  needsEmailConfirmation: boolean;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: email.split("@")[0] ?? "User",
        },
      },
    });

    if (error) {
      return { error, needsEmailConfirmation: false };
    }

    return {
      error: null,
      needsEmailConfirmation: signUpNeedsEmailConfirmation(data),
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error };
  }, []);

  const signInWithOAuth = useCallback(async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    return { error };
  }, []);

  const user = session?.user ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      userId: user?.id ?? null,
      isAuthenticated: Boolean(session && user && isEmailConfirmed(user)),
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      resendConfirmationEmail,
    }),
    [user, session, loading, signUp, signIn, signInWithOAuth, signOut, resendConfirmationEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
