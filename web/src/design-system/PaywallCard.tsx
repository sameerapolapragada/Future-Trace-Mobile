import { Badge } from "./Badge";
import { Card } from "./Card";
import { PrimaryButton, PrimaryButtonLink } from "./PrimaryButton";
import { cn } from "./utils";

type PaywallCardProps = {
  title?: string;
  description?: string;
  price?: string;
  priceSuffix?: string;
  badge?: string;
  features?: string[];
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  secondaryTo?: string;
  className?: string;
};

export function PaywallCard({
  title = "Unlock Career X-Ray Pass",
  description = "Deep skill gap analysis, transition roles, and AI exposure breakdown.",
  price = "$1.99",
  priceSuffix = " one-time",
  badge = "Career X-Ray Pass",
  features = [],
  primaryLabel = "Unlock X-Ray",
  secondaryLabel = "Maybe later",
  onPrimary,
  secondaryTo = "/profile",
  className,
}: PaywallCardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Card variant="gradient" className="relative overflow-hidden" padding="md">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />
        <Badge tone="info">{badge}</Badge>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <p className="mt-5 text-3xl font-bold tabular-nums text-white">
          {price}
          <span className="text-base font-normal text-muted">{priceSuffix}</span>
        </p>
      </Card>

      {features.length > 0 && (
        <Card padding="md">
          <p className="mb-3 text-sm font-semibold text-white">What&apos;s included</p>
          <ul className="space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] text-accent">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <PrimaryButton fullWidth onClick={onPrimary}>
          {primaryLabel}
        </PrimaryButton>
        <PrimaryButtonLink to={secondaryTo} fullWidth>
          {secondaryLabel}
        </PrimaryButtonLink>
      </div>
    </div>
  );
}
