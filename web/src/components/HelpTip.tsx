import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

type HelpTipProps = {
  title: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

export function HelpTip({ title, ariaLabel, children, className, align = "right" }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const panelId = `help-tip-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[9px] font-semibold leading-none text-muted transition hover:border-white/25 hover:text-white ft-focus-ring"
      >
        ?
      </button>

      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className={cn(
            "absolute top-full z-20 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-navy-card p-3 text-left shadow-lg",
            align === "right" && "right-0",
            align === "left" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2"
          )}
        >
          <p className="mb-1.5 text-[11px] font-semibold text-white">{title}</p>
          <div className="text-[11px] leading-relaxed text-muted">{children}</div>
        </div>
      ) : null}
    </span>
  );
}
