import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { createCareerScan, fetchCareerScan, type ScanFormInput } from "../lib/scanService";
import { cn } from "../lib/cn";

const STEPS = [
  "Mapping your current role",
  "Detecting AI-exposed tasks",
  "Finding adjacent career opportunities",
  "Calculating skill gaps",
  "Building your resilience index",
] as const;

const MAX_WAIT_MS = 120_000;
const POLL_MS = 1500;

type LocationState = {
  scanId?: string;
  pendingInput?: ScanFormInput;
};

export default function ScanLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState | null;
  const pendingInput = state?.pendingInput;
  const scanIdFromState = state?.scanId;
  const startedRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingInput && !scanIdFromState) {
      navigate("/scan", { replace: true });
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const stepTimer = window.setInterval(() => {
      setActiveIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, MAX_WAIT_MS / STEPS.length);

    let cancelled = false;

    async function waitForComplete(scanId: string) {
      const started = Date.now();
      while (!cancelled && Date.now() - started < MAX_WAIT_MS) {
        const scan = await fetchCareerScan(user!.id, scanId);
        if (scan?.freeResult && scan.status === "complete") {
          navigate(`/results/${scanId}`, { replace: true });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
      }
      if (!cancelled) {
        setError("Scan is taking longer than expected. Please try again.");
      }
    }

    async function run() {
      if (!user?.id) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        if (pendingInput) {
          const scan = await createCareerScan(user.id, pendingInput);
          if (cancelled) return;
          if (scan.freeResult && scan.status === "complete") {
            navigate(`/results/${scan.id}`, { replace: true });
            return;
          }
          await waitForComplete(scan.id);
          return;
        }

        if (scanIdFromState) {
          await waitForComplete(scanIdFromState);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not complete your scan.");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      window.clearInterval(stepTimer);
    };
  }, [navigate, pendingInput, scanIdFromState, user?.id]);

  const progressPercent = Math.round(((activeIndex + 1) / STEPS.length) * 100);

  return (
    <div className="flex w-full max-w-sm flex-1 flex-col justify-center px-1">
      <h1 className="text-center text-xl font-bold tracking-tight text-white">
        Analyzing your career profile…
      </h1>

      <ul className="mt-10 space-y-4" aria-live="polite">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 text-sm transition",
              index > activeIndex && "opacity-40"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                index <= activeIndex ? "bg-accent" : "bg-white/20"
              )}
            />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-purple transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {error ? (
        <div className="mt-6 space-y-3 text-center">
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
          <PrimaryButton fullWidth onClick={() => navigate("/scan", { replace: true })}>
            Back to Career Scan
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
