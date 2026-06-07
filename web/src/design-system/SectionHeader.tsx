import { Link } from "react-router-dom";
import { cn } from "./utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: {
    label: string;
    to: string;
  };
  className?: string;
};

export function SectionHeader({ title, subtitle, eyebrow, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-accent-soft/80">
            {eyebrow}
          </p>
        )}
        <h2 className={cn("text-sm font-semibold tracking-tight text-white", eyebrow && "mt-0.5")}>
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="shrink-0 text-xs font-medium text-accent transition hover:text-accent-soft"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** In-page header with optional back link (upgrade, detail flows). */
export function PageHeader({
  title,
  subtitle,
  backTo,
  className,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-5", className)}>
      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted transition hover:text-white"
        >
          <span aria-hidden>←</span> Back
        </Link>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
