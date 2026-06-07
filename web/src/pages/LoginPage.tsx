import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Provider } from "@supabase/supabase-js";
import { LogoMarkWithGlow, PrimaryButton, SecondaryButton } from "../design-system";
import { isEmailNotConfirmedError } from "../auth/authUtils";
import { useAuth } from "../auth/useAuth";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/8 hover:text-white ft-focus-ring"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.2 1.8c0 1.8-2.2 2-2.2 3.7" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

const inputWrapClass =
  "relative flex items-center rounded-2xl border border-white/8 bg-navy-elevated focus-within:border-accent/40";

const inputClass =
  "w-full bg-transparent py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-muted/70";

function OAuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-muted">or continue with</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-1.6 3.6-5.4 3.6-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17.5 2.8 15 1.8 12 1.8 6.9 1.8 2.7 6 2.7 11.1S6.9 20.4 12 20.4c6.9 0 8.5-4.8 8.5-7.3 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 13.3c-.1-2.1 1.7-3.1 1.8-3.2-1-.1-2-.6-2.5-1.5-.6-.9-.5-2.1-.1-2.9 1-.1 2 .6 2.5 1.5.6.9.5 2.1.1 2.9-.5.8-1.5 1.4-2.5 1.5.1.1 1.8 1.1 1.7 3.2zm-2.2 4.8c-1 .9-2.1 1.6-3.4 1.6-1.3 0-1.7-.8-3.2-.8-1.5 0-2 .8-3.2.8-1.3 0-2.4-.7-3.4-1.6-2.1-1.9-3.7-5.4-1.5-7.8 1.1-1.2 2.6-2 4.2-2 .9 0 1.7.5 2.5.5.8 0 1.4-.5 2.4-.5 1.5 0 2.8.8 3.9 2.1-3.4 1.9-2.8 6.7-.5 8.7z" />
    </svg>
  );
}

function OAuthButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-navy-elevated px-4 py-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-60 ft-focus-ring"
    >
      {icon}
      {label}
    </button>
  );
}

const RESEND_COOLDOWN_SEC = 60;

function ConfirmEmailPanel({
  email,
  onBackToSignIn,
}: {
  email: string;
  onBackToSignIn: () => void;
}) {
  const { resendConfirmationEmail } = useAuth();
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;

    setResendError(null);
    setResendMessage(null);
    setResending(true);

    const { error } = await resendConfirmationEmail(email);

    setResending(false);

    if (error) {
      setResendError(error.message);
      return;
    }

    setResendMessage("Confirmation email sent. Check your inbox and spam folder.");
    setCooldown(RESEND_COOLDOWN_SEC);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-soft">
        <MailIcon />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        We sent a confirmation link to{" "}
        <span className="font-medium text-white">{email}</span>. Open the link to activate your
        account, then sign in.
      </p>

      {resendError ? (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {resendError}
        </p>
      ) : null}

      {resendMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {resendMessage}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="button"
          fullWidth
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend confirmation email"}
        </PrimaryButton>

        <SecondaryButton type="button" fullWidth onClick={onBackToSignIn}>
          Back to sign in
        </SecondaryButton>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [step, setStep] = useState<"form" | "confirm-email">("form");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";
  const redirectTo =
    (location.state as { from?: string } | null)?.from?.startsWith("/") === true
      ? (location.state as { from: string }).from
      : "/home";

  useEffect(() => {
    setError(null);
  }, [mode]);

  function showConfirmEmail(confirmEmail: string) {
    setPendingEmail(confirmEmail);
    setStep("confirm-email");
    setError(null);
  }

  function handleBackToSignIn() {
    setStep("form");
    setMode("signin");
    setPassword("");
    setError(null);
  }

  async function handleOAuth(provider: Provider) {
    setError(null);
    setSubmitting(true);

    const { error: authError } = await signInWithOAuth(provider);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (isSignup) {
      const { error: authError, needsEmailConfirmation } = await signUp(email, password);
      setSubmitting(false);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (needsEmailConfirmation) {
        showConfirmEmail(email.trim().toLowerCase());
        return;
      }
    } else {
      const { error: authError } = await signIn(email, password);
      setSubmitting(false);

      if (authError) {
        if (isEmailNotConfirmedError(authError.message)) {
          showConfirmEmail(email.trim().toLowerCase());
          return;
        }

        setError(authError.message);
        return;
      }
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="ft-display-page relative flex min-h-[calc(100svh-2rem)] flex-col px-4 pb-6">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-accent-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between">
        <BackButton onClick={() => navigate("/onboarding")} />
        <button
          type="button"
          aria-label="Help"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-white/20 hover:text-white ft-focus-ring"
        >
          <HelpIcon />
        </button>
      </div>

      <div className="relative z-10 mx-auto mt-2 w-full max-w-sm flex-1">
        {step === "confirm-email" ? (
          <ConfirmEmailPanel email={pendingEmail} onBackToSignIn={handleBackToSignIn} />
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="login-logo-float-wrap mx-auto mb-10">
                <LogoMarkWithGlow size={112} className="login-logo-enter" />
              </div>
              <h1 className="login-title-enter text-2xl font-bold tracking-tight text-white">
                {isSignup ? "Start Your Career Scan" : "Welcome back"}
              </h1>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-left">
                <span className="mb-2 block text-xs font-medium text-muted">Email</span>
                <div className={inputWrapClass}>
                  <span className="pointer-events-none absolute left-4 text-muted">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
              </label>

              <label className="block text-left">
                <span className="mb-2 block text-xs font-medium text-muted">Password</span>
                <div className={inputWrapClass}>
                  <span className="pointer-events-none absolute left-4 text-muted">
                    <LockIcon />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder={isSignup ? "Create a password (min 6 characters)" : "Enter your password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    disabled={submitting}
                  />
                </div>
              </label>

              {error ? (
                <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <PrimaryButton type="submit" fullWidth className="mt-2" disabled={submitting}>
                {submitting ? "Please wait…" : isSignup ? "Create Account" : "Sign in"}
              </PrimaryButton>
            </form>

            <div className="mt-5 space-y-3">
              <OAuthDivider />
              <OAuthButton
                label="Continue with Google"
                icon={<GoogleIcon />}
                onClick={() => handleOAuth("google")}
                disabled={submitting}
              />
              <OAuthButton
                label="Continue with Apple"
                icon={<AppleIcon />}
                onClick={() => handleOAuth("apple")}
                disabled={submitting}
              />
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setMode(isSignup ? "signin" : "signup")}
                className="font-medium text-accent-soft transition hover:text-white ft-focus-ring"
                disabled={submitting}
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </>
        )}
      </div>

      <p className="relative z-10 mt-auto flex items-center justify-center gap-2 pt-8 text-center text-xs text-muted">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        Your career data stays private.
      </p>
    </div>
  );
}
