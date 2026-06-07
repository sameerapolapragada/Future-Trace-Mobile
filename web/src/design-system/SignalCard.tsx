import type { RiskLevel } from "../types";
import { Badge, badgeToneFromRisk } from "./Badge";
import { Card } from "./Card";
import { cn } from "./utils";

export type SignalTrend = "up" | "down" | "flat";

export type SignalCardProps = {
  title: string;
  summary: string;
  category: string;
  impact: RiskLevel;
  trend: SignalTrend;
  date?: string;
  /** Compact layout for home previews */
  compact?: boolean;
  /** Blurred / locked preview state */
  locked?: boolean;
  className?: string;
  onClick?: () => void;
};

const trendMeta: Record<SignalTrend, { icon: string; label: string }> = {
  up: { icon: "↑", label: "Trending up" },
  down: { icon: "↓", label: "Trending down" },
  flat: { icon: "→", label: "Stable" },
};

const impactAccent: Record<RiskLevel, string> = {
  high: "from-danger/80 to-danger/20",
  medium: "from-warning/80 to-warning/20",
  low: "from-success/80 to-success/20",
};

export function SignalCard({
  title,
  summary,
  category,
  impact,
  trend,
  date,
  compact = false,
  locked = false,
  className,
  onClick,
}: SignalCardProps) {
  const trendInfo = trendMeta[trend];

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        locked && "pointer-events-none select-none blur-sm",
        className
      )}
      onClick={onClick}
      padding={compact ? "sm" : "md"}
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b",
          impactAccent[impact]
        )}
        aria-hidden
      />

      <div className="pl-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="default">{category}</Badge>
          <div className="flex items-center gap-2">
            <Badge tone={badgeToneFromRisk(impact)}>{impact} impact</Badge>
            <span
              className="text-sm text-muted"
              title={trendInfo.label}
              aria-label={trendInfo.label}
            >
              {trendInfo.icon}
            </span>
          </div>
        </div>

        <h3
          className={cn(
            "mt-3 font-semibold leading-snug text-white",
            compact ? "text-sm" : "text-sm"
          )}
        >
          {title}
        </h3>

        {!compact && <p className="mt-2 text-sm leading-relaxed text-muted">{summary}</p>}

        {compact && summary && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{summary}</p>
        )}

        {date && !compact && <p className="mt-3 text-xs tabular-nums text-muted-dim">{date}</p>}
      </div>
    </Card>
  );
}
