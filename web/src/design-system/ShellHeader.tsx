import { Link } from "react-router-dom";
import type { RouteHeader } from "../types/route";

export function ShellHeader({ title, subtitle, backTo }: RouteHeader) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-navy/95 px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-lg">
      {backTo && (
        <Link
          to={backTo}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-white"
        >
          <span aria-hidden>←</span> Back
        </Link>
      )}
      <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
