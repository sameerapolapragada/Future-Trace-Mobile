import { cn } from "./utils";

type ScoreCircleProps = {
  score: number;
  size?: number;
  label?: string;
  suffix?: string;
  className?: string;
};

export function ScoreCircle({ score, size = 96, label, suffix, className }: ScoreCircleProps) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradId = `score-grad-${size}`;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <div
        className="absolute inset-0 m-auto rounded-full bg-accent-purple/10 blur-xl"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3498DB" />
            <stop offset="100%" stopColor="#4D47C2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="flex items-baseline gap-0.5 text-3xl font-bold tabular-nums tracking-tight text-white">
          {score}
          {suffix && (
            <span className="text-base font-normal text-muted">{suffix}</span>
          )}
        </span>
        {label && (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
