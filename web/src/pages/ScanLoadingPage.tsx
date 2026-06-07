import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";

const STEPS = [
  "Mapping your current role",
  "Detecting AI-exposed tasks",
  "Finding adjacent career opportunities",
  "Calculating skill gaps",
  "Building your resilience index",
] as const;

const NAV_DELAY_MS = 5500;
const STEP_INTERVAL_MS = NAV_DELAY_MS / STEPS.length;

type StepStatus = "pending" | "active" | "complete";

function getStepStatus(index: number, activeIndex: number): StepStatus {
  if (index < activeIndex) return "complete";
  if (index === activeIndex) return "active";
  return "pending";
}

function AnalysisIcon() {
  return (
    <div className="relative mx-auto mb-8 flex h-[72px] w-[72px] items-center justify-center">
      <div className="scan-icon-glow absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-accent-purple/25 blur-xl" />
      <div className="scan-icon-ring absolute inset-0 rounded-full border border-accent/25" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent-purple/25 shadow-lg shadow-accent/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient id="scan-layers" x1="4" y1="4" x2="20" y2="20">
              <stop offset="0" stopColor="#5B8DEF" />
              <stop offset="1" stopColor="#8B7CF6" />
            </linearGradient>
          </defs>
          <path
            d="M12 3 4 8v8l8 5 8-5V8l-8-5z"
            stroke="url(#scan-layers)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M4 8l8 5 8-5M12 13v8"
            stroke="url(#scan-layers)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-accent" />
    );
  }

  return <span className="h-6 w-6 shrink-0 rounded-full border border-white/15" />;
}

function LoadingEllipsis() {
  return (
    <span className="ml-auto flex items-center gap-1 pl-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-accent",
            "scan-ellipsis-dot",
            i === 1 && "scan-ellipsis-dot-2",
            i === 2 && "scan-ellipsis-dot-3"
          )}
        />
      ))}
    </span>
  );
}

export default function ScanLoadingPage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const completedCount = activeIndex;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setActiveIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, STEP_INTERVAL_MS);

    const navTimer = window.setTimeout(() => {
      navigate("/canvas", { state: { scanId: "scan-1" }, replace: true });
    }, NAV_DELAY_MS);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="flex w-full max-w-sm flex-1 flex-col justify-center px-1">
      <AnalysisIcon />

      <h1 className="text-center text-xl font-bold tracking-tight text-white">
        Analyzing your career profile...
      </h1>

      <ul className="mt-10 space-y-4" aria-label="Scan progress" aria-live="polite">
        {STEPS.map((label, index) => {
          const status = getStepStatus(index, activeIndex);
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 transition-all duration-500",
                status === "pending" && "opacity-40"
              )}
            >
              <StepIndicator status={status} />
              <span
                className={cn(
                  "text-sm transition-colors duration-300",
                  status === "pending" ? "text-muted" : "text-white"
                )}
              >
                {label}
              </span>
              {status === "active" && <LoadingEllipsis />}
            </li>
          );
        })}
      </ul>

      <div className="mt-10">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-purple transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>
            {completedCount} of {STEPS.length} complete
          </span>
          <span className="tabular-nums">{progressPercent}%</span>
        </div>
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted">
        <span className="scan-secure-dot h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        Secure AI processing
      </p>
    </div>
  );
}
