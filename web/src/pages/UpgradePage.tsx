import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "../design-system";
import { products } from "../data/mockData";
import { isCheckoutConfigured, startTransitionCheckout } from "../lib/checkoutService";
import { formatCycleResetDate } from "../lib/subscriptionUsageService";
import { TRANSITION_PLAN_FEATURES } from "../lib/subscriptionLimits";
import { useEntitlements } from "../lib/entitlements";
import { cn } from "../lib/cn";

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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type LimitReason = "weekly-scan" | "monthly-scans" | "monthly-xrays" | "goal-switches" | null;

function resolveLimitReason(searchParams: URLSearchParams, isTransition: boolean): LimitReason {
  const reason = searchParams.get("reason");
  if (reason === "weekly-scan" || searchParams.get("scans") === "exhausted") return "weekly-scan";
  if (reason === "monthly-scans") return "monthly-scans";
  if (reason === "monthly-xrays") return "monthly-xrays";
  if (reason === "goal-switches") return "goal-switches";
  return isTransition ? null : null;
}

export default function UpgradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { entitlements } = useEntitlements();
  const isTransition =
    searchParams.get("product") === "transition" || searchParams.get("product") === "radar";
  const limitReason = resolveLimitReason(searchParams, isTransition);
  const resetDate = entitlements.monthlyUsage?.cycleResetDate
    ? formatCycleResetDate(entitlements.monthlyUsage.cycleResetDate)
    : null;

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleStartTransition() {
    if (!isCheckoutConfigured()) {
      setCheckoutError(
        "Checkout is not configured. Set VITE_API_BASE_URL in web/.env.local and run the Future-Trace BFF."
      );
      return;
    }

    setLoading(true);
    setCheckoutError(null);

    try {
      const url = await startTransitionCheckout();
      window.location.assign(url);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (limitReason === "monthly-scans") {
    return (
      <LimitLayout title="Career Scan limit" onBack={() => navigate(-1)}>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;ve used all 10 career scans for this month.
          {resetDate ? ` Your limit resets on ${resetDate}.` : null}
        </p>
        <SecondaryButton fullWidth onClick={() => navigate("/transition")}>
          Wait until reset
        </SecondaryButton>
      </LimitLayout>
    );
  }

  if (limitReason === "monthly-xrays") {
    return (
      <LimitLayout title="Career X-Ray limit" onBack={() => navigate(-1)}>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;ve used all 10 included Career X-Rays this month.
        </p>
        <p className="text-sm text-white">Extra Career X-Ray: {products.xray.price}</p>
        <PrimaryButton fullWidth onClick={() => navigate("/xray-history")}>
          Buy Extra X-Ray — {products.xray.price}
        </PrimaryButton>
      </LimitLayout>
    );
  }

  if (limitReason === "goal-switches") {
    return (
      <LimitLayout title="Goal switch limit" onBack={() => navigate(-1)}>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;ve used all 3 goal switches this month. To avoid losing progress, you can continue
          your current goal or wait until your next billing cycle.
          {resetDate ? ` Resets on ${resetDate}.` : null}
        </p>
        <PrimaryButton fullWidth onClick={() => navigate("/transition")}>
          Continue Current Goal
        </PrimaryButton>
      </LimitLayout>
    );
  }

  return (
    <div className="relative space-y-6 pb-4">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-accent-purple/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-32 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex items-center">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-semibold text-white">
          AI Career Transition
        </h1>
      </div>

      {limitReason === "weekly-scan" ? (
        <p className="relative text-center text-sm leading-relaxed text-muted">
          Free users can run 1 scan per week. Upgrade to AI Career Transition for 10 career scans per
          month and a guided transition plan.
        </p>
      ) : (
        <p className="relative text-center text-sm leading-relaxed text-muted">
          Get weekly milestones, monthly scan and X-Ray allowances, and smart reminders to keep your
          transition moving.
        </p>
      )}

      <div className="relative rounded-2xl border border-accent-purple/40 bg-navy-card p-5 shadow-lg shadow-accent-purple/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-purple/60 to-transparent" />

        <h2 className="text-base font-bold text-white">AI Career Transition</h2>
        <p className="mt-1 text-xs text-muted">Move from your current role to your target role</p>

        <div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-white">
            $9.99
            <span className="text-base font-normal text-muted"> /month</span>
          </p>
          <p className="mt-1 text-xs text-muted">Cancel anytime</p>
        </div>

        <div className="my-5 h-px bg-white/6" />

        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">Includes</p>
        <ul className="space-y-2.5">
          {TRANSITION_PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-white">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
                <CheckIcon />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted">Extra Career X-Ray: {products.xray.price} each</p>

        <PrimaryButton
          fullWidth
          disabled={loading}
          onClick={() => void handleStartTransition()}
          className={cn("mt-5 flex items-center justify-center gap-2")}
        >
          {loading ? "Redirecting to checkout…" : "Start AI Career Transition"}
        </PrimaryButton>
      </div>

      <p className="relative text-center text-xs text-muted">
        Prefer a one-time snapshot only?{" "}
        <button
          type="button"
          onClick={() => navigate("/xray/new")}
          className="font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
        >
          Get Career X-Ray for {products.xray.price}
        </button>
      </p>

      {checkoutError ? (
        <p className="relative text-center text-xs text-red-400" role="alert">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}

function LimitLayout({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-semibold text-white">
          {title}
        </h1>
      </div>
      <div className="rounded-2xl border border-white/8 bg-navy-card p-5 space-y-4">{children}</div>
    </div>
  );
}
