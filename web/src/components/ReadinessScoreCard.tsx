import { useId } from "react";
import { cn } from "../lib/cn";

type ReadinessScoreCardProps = {
  score: number;
  className?: string;
};

function readinessLabel(score: number): string {
  if (score >= 80) return "Excellent progress! 🎉";
  if (score >= 65) return "Good progress! 🎉";
  if (score >= 45) return "Building momentum";
  return "Getting started";
}

function monthHistory(score: number): { label: string; value: number | null }[] {
  const now = new Date();
  const points: { label: string; value: number | null }[] = [];

  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(undefined, { month: "short" });
    if (i === 0) {
      points.push({ label, value: null });
    } else {
      const drift = i * 8 + 1;
      points.push({ label, value: Math.max(0, Math.min(100, score - drift)) });
    }
  }

  return points;
}

function ReadinessArcGauge({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcPortion = 0.75;
  const arcLength = circumference * arcPortion;
  const progress = Math.min(100, Math.max(0, score));
  const progressLength = arcLength * (progress / 100);
  const gradId = useId();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block rotate-[135deg]"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007bff" />
            <stop offset="45%" stopColor="#4D47C2" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold tabular-nums leading-none text-white">{score}</span>
        <span className="mt-0.5 text-sm font-medium text-muted">/100</span>
      </div>
    </div>
  );
}

function ReadinessTrendChart({
  history,
  className,
}: {
  history: { label: string; value: number | null }[];
  className?: string;
}) {
  const numeric = history.filter((h) => h.value !== null) as { label: string; value: number }[];
  const values = numeric.map((h) => h.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const axisMin = dataMin - 4;
  const axisMax = dataMax + 4;
  const axisRange = Math.max(axisMax - axisMin, 14);

  const points = history.map((point, index) => {
    const xPct = (index / (history.length - 1)) * 100;
    const yPct =
      point.value === null ? null : ((axisMax - point.value) / axisRange) * 100;
    return { ...point, xPct, yPct };
  });

  const linePoints = points.filter((p) => p.yPct !== null) as Array<{
    label: string;
    value: number;
    xPct: number;
    yPct: number;
  }>;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="relative h-14 w-full">
        <div className="absolute inset-x-0 top-0 grid grid-cols-4 text-center text-[9px] font-semibold tabular-nums leading-none text-white">
          {history.map((point) => (
            <span key={point.label}>{point.value ?? "—"}</span>
          ))}
        </div>

        <div className="absolute inset-x-0 top-[13px] bottom-[13px]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {linePoints.length > 1 ? (
              <polyline
                fill="none"
                className="stroke-accent"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints.map((p) => `${p.xPct},${p.yPct}`).join(" ")}
              />
            ) : null}
          </svg>

          {linePoints.map((point) => (
            <div
              key={point.label}
              className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-[#0f0f0f]"
              style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}
            >
              <span className="absolute left-1/2 top-1/2 block size-[2.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 text-center text-[9px] leading-none text-muted">
          {history.map((point) => (
            <span key={`${point.label}-month`}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReadinessScoreCard({ score, className }: ReadinessScoreCardProps) {
  const history = monthHistory(score);
  const lastRecorded = history.filter((h) => h.value !== null).at(-1)?.value ?? score;
  const priorRecorded = history.filter((h) => h.value !== null).at(-2)?.value ?? lastRecorded;
  const monthlyDelta = Math.max(0, lastRecorded - priorRecorded);

  return (
    <section className={cn("rounded-2xl border border-white/8 bg-navy-card p-4", className)}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">Readiness score</p>

      <div className="flex items-center gap-3">
        <ReadinessArcGauge score={score} size={96} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-white">{readinessLabel(score)}</p>
          <p className="mt-0.5 text-xs leading-tight">
            <span className="font-semibold text-success">+{monthlyDelta} points</span>
            <span className="text-white"> from last month</span>
          </p>
          <ReadinessTrendChart history={history} className="mt-2" />
        </div>
      </div>
    </section>
  );
}
