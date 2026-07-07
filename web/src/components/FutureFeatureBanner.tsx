import { useState } from "react";
import { PrimaryButton } from "../design-system";
import { cn } from "../lib/cn";
import { EarlyAccessWaitlistForm } from "./EarlyAccessWaitlistForm";

const ROADMAP_FEATURES = [
  "Learn what skills to build",
  "Understand transition pathways",
  "Track progress toward future roles",
] as const;

type FutureFeatureBannerProps = {
  email: string;
  currentRole?: string;
  targetRole?: string;
  className?: string;
};

export function FutureFeatureBanner({
  email,
  currentRole,
  targetRole,
  className,
}: FutureFeatureBannerProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section
      className={cn(
        "rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/10 to-navy-card p-4",
        className
      )}
    >
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">
        AI Career Roadmap — Coming Soon
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/90">
        A guided transition plan with milestones and progress tracking is on the way.
      </p>

      <ul className="mt-3 space-y-2">
        {ROADMAP_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-white/90">
            <span className="mt-0.5 text-accent-purple" aria-hidden>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {!showForm ? (
        <PrimaryButton fullWidth className="mt-4" onClick={() => setShowForm(true)}>
          Join Early Access
        </PrimaryButton>
      ) : (
        <EarlyAccessWaitlistForm
          email={email}
          currentRole={currentRole}
          targetRole={targetRole}
          source="web_app"
          className="mt-4 border-accent-purple/20 bg-navy-card/80"
        />
      )}
    </section>
  );
}
