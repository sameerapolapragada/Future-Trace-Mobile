import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoMarkWithGlow, PrimaryButton } from "../design-system";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/home");
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder={isSignup ? "Create a password" : "Enter your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
          </label>

          <PrimaryButton type="submit" fullWidth className="mt-2">
            {isSignup ? "Create Account" : "Sign in"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "signin" : "signup")}
            className="font-medium text-accent-soft transition hover:text-white ft-focus-ring"
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>

      <p className="relative z-10 mt-auto flex items-center justify-center gap-2 pt-8 text-center text-xs text-muted">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        Your career data stays private.
      </p>
    </div>
  );
}
