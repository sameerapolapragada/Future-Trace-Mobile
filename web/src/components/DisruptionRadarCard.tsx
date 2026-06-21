import { Badge } from "../design-system";
import { buildDisruptionRadarBrief } from "../../../lib/shared";
import { cn } from "../lib/cn";
import type { FreeScanResult } from "../types";

const statusTone = {
  Stable: "success",
  Evolving: "warning",
  "At Risk": "danger",
} as const;

const statusBorder = {
  Stable: "border-success/25",
  Evolving: "border-warning/25",
  "At Risk": "border-danger/25",
} as const;

type DisruptionRadarCardProps = {
  result: FreeScanResult;
  className?: string;
};

export function DisruptionRadarCard({ result, className }: DisruptionRadarCardProps) {
  const radar = buildDisruptionRadarBrief(result);

  return (
    <section
      className={cn(
        "rounded-2xl border bg-navy-card/90 p-4",
        statusBorder[radar.status],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">
          AI Disruption Radar
        </h2>
        <Badge tone={statusTone[radar.status]}>{radar.status}</Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/90">{radar.explanation}</p>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Suggested next action
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/90">{radar.nextAction}</p>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Informational guidance only — not real-time labor market data.
      </p>
    </section>
  );
}
