import { cn } from "./utils";

export type BadgeTone = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tone === "default" && "bg-white/10 text-white/80",
        tone === "success" && "bg-emerald-500/15 text-emerald-300",
        tone === "warning" && "bg-amber-500/15 text-amber-300",
        tone === "danger" && "bg-red-500/15 text-red-300",
        tone === "info" && "bg-accent/15 text-accent-soft",
        className
      )}
    >
      {children}
    </span>
  );
}

export function badgeToneFromTrend(trend: "rising" | "stable" | "declining"): BadgeTone {
  if (trend === "rising") return "success";
  if (trend === "declining") return "danger";
  return "warning";
}

export function badgeToneFromRisk(risk: "low" | "medium" | "high"): BadgeTone {
  if (risk === "low") return "success";
  if (risk === "high") return "danger";
  return "warning";
}
