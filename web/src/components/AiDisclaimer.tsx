import { cn } from "../lib/cn";

type AiDisclaimerProps = {
  className?: string;
  compact?: boolean;
};

export function AiDisclaimer({ className, compact = false }: AiDisclaimerProps) {
  return (
    <p
      className={cn(
        "text-muted leading-relaxed",
        compact ? "text-[10px]" : "text-xs",
        className
      )}
      role="note"
    >
      AI-generated insights informed by labor market data; not real-time job listings. Scores and
      recommendations are advisory only and do not constitute career, legal, or financial advice.
    </p>
  );
}
