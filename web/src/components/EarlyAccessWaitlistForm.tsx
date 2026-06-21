import { useState } from "react";
import { PrimaryButton } from "../design-system";
import { cn } from "../lib/cn";
import { submitWaitlistEntry } from "../lib/waitlistService";

const inputClass =
  "w-full rounded-2xl border border-white/8 bg-navy-elevated px-4 py-3.5 text-sm text-white outline-none placeholder:text-muted/60 focus:border-accent/40 ft-focus-ring";

type EarlyAccessWaitlistFormProps = {
  email: string;
  currentRole?: string;
  targetRole?: string;
  source: string;
  className?: string;
  onSuccess?: () => void;
};

export function EarlyAccessWaitlistForm({
  email: defaultEmail,
  currentRole: defaultCurrentRole = "",
  targetRole: defaultTargetRole = "",
  source,
  className,
  onSuccess,
}: EarlyAccessWaitlistFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [currentRole, setCurrentRole] = useState(defaultCurrentRole);
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitWaitlistEntry({
        email,
        currentRole,
        targetRole,
        source,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join waitlist.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={cn("rounded-2xl border border-success/25 bg-navy-card/90 p-4 text-center", className)}>
        <p className="text-sm font-medium text-white">You&apos;re on the early access list.</p>
        <p className="mt-1 text-xs text-muted">We&apos;ll email you when this feature launches.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn("rounded-2xl border border-accent/25 bg-navy-card/90 p-4 space-y-3", className)}
    >
      <div>
        <label htmlFor={`waitlist-email-${source}`} className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Email
        </label>
        <input
          id={`waitlist-email-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={cn(inputClass, "mt-1.5")}
        />
      </div>

      <div>
        <label htmlFor={`waitlist-current-${source}`} className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Current role
        </label>
        <input
          id={`waitlist-current-${source}`}
          type="text"
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          placeholder="e.g. Salesforce Administrator"
          className={cn(inputClass, "mt-1.5")}
        />
      </div>

      <div>
        <label htmlFor={`waitlist-target-${source}`} className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Target role
        </label>
        <input
          id={`waitlist-target-${source}`}
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. RevOps Analyst"
          className={cn(inputClass, "mt-1.5")}
        />
      </div>

      <PrimaryButton type="submit" fullWidth disabled={loading}>
        {loading ? "Joining…" : "Join Early Access"}
      </PrimaryButton>

      {error ? (
        <p className="text-center text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
