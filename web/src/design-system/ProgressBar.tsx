import { cn } from "./utils";

type ProgressBarProps = {
  value: number;
  max?: number;
  className?: string;
  size?: "sm" | "md";
  variant?: "blue" | "purple" | "green";
  showLabel?: boolean;
  label?: string;
};

const fillVariants = {
  blue: "bg-gradient-to-r from-accent to-accent-soft",
  purple: "bg-gradient-to-r from-accent-purple to-accent-soft",
  green: "bg-gradient-to-r from-emerald-500 to-emerald-400",
};

export function ProgressBar({
  value,
  max = 100,
  className,
  size = "sm",
  variant = "blue",
  showLabel,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span>{label}</span>
          {showLabel && <span className="tabular-nums text-white/80">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-white/8",
          size === "sm" && "h-2",
          size === "md" && "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", fillVariants[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
