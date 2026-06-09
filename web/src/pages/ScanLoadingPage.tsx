import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";

const STEPS = [
  "Mapping your current role",
  "Detecting AI-exposed tasks",
  "Finding adjacent career opportunities",
  "Calculating skill gaps",
  "Building your resilience index",
] as const;

const NAV_DELAY_MS = 4000;
const STEP_INTERVAL_MS = NAV_DELAY_MS / STEPS.length;

type LocationState = { scanId?: string };

export default function ScanLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scanId = (location.state as LocationState | null)?.scanId;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!scanId) {
      navigate("/scan", { replace: true });
      return;
    }

    const stepTimer = window.setInterval(() => {
      setActiveIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, STEP_INTERVAL_MS);

    const navTimer = window.setTimeout(() => {
      navigate(`/results/${scanId}`, { replace: true });
    }, NAV_DELAY_MS);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(navTimer);
    };
  }, [navigate, scanId]);

  const progressPercent = Math.round((activeIndex / STEPS.length) * 100);

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
    </div>
  );
}
