import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { products } from "../data/mockData";
import { isCheckoutConfigured, startCheckout } from "../lib/checkoutService";
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

function RadarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12 18 8" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UpgradePage() {
  const navigate = useNavigate();
  const { radar } = products;
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handlePurchaseRadar() {
    if (!isCheckoutConfigured()) {
      setCheckoutError(
        "Checkout is not configured. Set VITE_API_BASE_URL in web/.env.local and run the Future-Trace BFF."
      );
      return;
    }

    setLoading(true);
    setCheckoutError(null);

    try {
      const url = await startCheckout("radar");
      window.location.assign(url);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="relative space-y-6 pb-4">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-accent-purple/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-32 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex items-center">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-semibold text-white">
          AI Career Radar
        </h1>
      </div>

      <header className="relative text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Stay ahead of the AI job market</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Subscribe for your Career X-Ray snapshot plus ongoing live intelligence — no separate X-Ray
          purchase needed.
        </p>
      </header>

      <div className="relative rounded-2xl border border-accent-purple/40 bg-navy-card p-5 shadow-lg shadow-accent-purple/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-purple/60 to-transparent" />

        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-purple">
          <SparkleIcon className="h-3 w-3" />
          Includes Career X-Ray
        </span>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple to-accent-gold text-white">
            <RadarIcon />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">{radar.name}</h2>
            <p className="text-xs text-muted">{radar.description}</p>
          </div>
        </div>

        <p className="mt-3 rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-muted">
          Best for staying updated as the AI job market changes.
        </p>

        <div className="mt-4">
          <p className="text-3xl font-bold tabular-nums text-white">
            {radar.price}
            <span className="text-base font-normal text-muted"> /month</span>
          </p>
          <p className="mt-1 text-xs text-muted">Cancel anytime · X-Ray included at no extra cost</p>
        </div>

        <div className="my-5 h-px bg-white/6" />

        <ul className="space-y-2.5">
          {radar.features.map((feature, index) => (
            <li
              key={feature}
              className={cn(
                "flex items-start gap-2.5 text-sm",
                index === 0 ? "font-medium text-white" : "text-muted"
              )}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
                <CheckIcon />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <PrimaryButton
          fullWidth
          disabled={loading}
          onClick={() => void handlePurchaseRadar()}
          className="mt-5 flex items-center justify-center gap-2"
        >
          {loading ? "Redirecting to checkout…" : "Start AI Career Radar"}
        </PrimaryButton>
      </div>

      <p className="relative text-center text-xs text-muted">
        Prefer a one-time snapshot only?{" "}
        <button
          type="button"
          onClick={() => navigate("/career-xray")}
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

      <p className="relative text-center text-[11px] leading-relaxed text-muted">
        Secure Stripe checkout. Purchases unlock X-Ray and Radar in your account after payment.
      </p>
    </div>
  );
}
