import { useId } from "react";
import { cn } from "./utils";

type ScoreCircleProps = {
  score: number;
  size?: number;
  label?: string;
  suffix?: string;
  className?: string;
};

function scoreTypography(size: number) {
  if (size >= 96) {
    return { score: "text-3xl", suffix: "text-sm", label: "text-[10px]" };
  }
  if (size >= 80) {
    return { score: "text-2xl", suffix: "text-xs", label: "text-[10px]" };
  }
  return { score: "text-lg", suffix: "text-[9px]", label: "text-[8px]" };
}

export function ScoreCircle({ score, size = 96, label, suffix, className }: ScoreCircleProps) {
  const stroke = Math.max(4, Math.round(size * 0.07));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const offset = circumference - (progress / 100) * circumference;
  const gradId = useId();
  const type = scoreTypography(size);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label={label ? `${label}: ${score}${suffix ?? ""}` : undefined}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-purple/10 blur-xl"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3498DB" />
            <stop offset="100%" stopColor="#4D47C2" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        <div className="flex items-center justify-center gap-px leading-none">
          <span className={cn("font-bold tabular-nums text-white", type.score)}>{score}</span>
          {suffix ? (
            <span className={cn("font-medium text-muted", type.suffix)}>{suffix}</span>
          ) : null}
        </div>
        {label ? (
          <span
            className={cn(
              "mt-0.5 max-w-full truncate font-medium uppercase tracking-widest text-muted",
              type.label
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
