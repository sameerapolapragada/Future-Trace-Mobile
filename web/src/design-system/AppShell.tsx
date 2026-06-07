import { Outlet, useMatches } from "react-router-dom";
import { cn } from "../lib/cn";
import type { RouteHandle } from "../types/route";
import { BottomNav } from "./BottomNav";
import { ShellHeader } from "./ShellHeader";

function getRouteHandle(matches: ReturnType<typeof useMatches>): RouteHandle {
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as RouteHandle | undefined;
    if (handle) return handle;
  }
  return {};
}

export function AppShell() {
  const matches = useMatches();
  const { showNav, centered, header } = getRouteHandle(matches);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-navy shadow-2xl shadow-black/40">
      {header && <ShellHeader {...header} />}

      <main
        className={cn(
          "flex flex-1 flex-col",
          centered
            ? "items-center justify-center px-6"
            : "overflow-y-auto px-5 pb-6",
          header ? "pt-4" : "pt-[max(1rem,env(safe-area-inset-top))]",
          showNav && "pb-2"
        )}
      >
        <Outlet />
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-start justify-center bg-navy p-0 sm:bg-surface sm:p-4">
      <div className="w-full max-w-md overflow-hidden bg-navy sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/50">
        {children}
      </div>
    </div>
  );
}
