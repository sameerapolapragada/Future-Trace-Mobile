import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { cn } from "./utils";

type RoleCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: "default" | "success" | "warning" | "danger" | "info";
  to?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  className?: string;
};

export function RoleCard({
  title,
  subtitle,
  badge,
  badgeTone = "info",
  to,
  onClick,
  trailing,
  className,
}: RoleCardProps) {
  const content = (
    <Card
      className={cn("relative flex items-center justify-between gap-3 overflow-hidden", className)}
      onClick={!to ? onClick : undefined}
      padding="md"
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-0.5 bg-gradient-to-b from-accent-soft/80 to-accent-purple/30"
        aria-hidden
      />
      <div className="min-w-0 flex-1 pl-2">
        <p className="truncate font-semibold tracking-tight text-white">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
        {badge && (
          <div className="mt-2">
            <Badge tone={badgeTone}>{badge}</Badge>
          </div>
        )}
      </div>
      {trailing ?? (to || onClick ? <span className="shrink-0 text-accent-soft">→</span> : null)}
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block transition active:scale-[0.99]">
        {content}
      </Link>
    );
  }

  return content;
}
