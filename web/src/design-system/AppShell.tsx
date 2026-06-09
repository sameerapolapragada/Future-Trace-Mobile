import { useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router-dom";
import { AppSidebar, SidebarMenuButton } from "../components/AppSidebar";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../auth/useAuth";
import { SidebarProvider, useSidebar } from "../lib/SidebarContext";
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

function AppShellContent() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { closeMobile } = useSidebar();
  const { showNav, centered, header } = getRouteHandle(matches);
  const showSidebar = isAuthenticated && !centered;

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <div className="flex min-h-svh w-full bg-navy">
      {showSidebar ? <AppSidebar /> : null}

      <div
        className={cn(
          "mx-auto flex min-h-svh w-full min-w-0 flex-1 flex-col shadow-2xl shadow-black/40",
          showSidebar ? "max-w-none" : "max-w-md"
        )}
      >
        {header && <ShellHeader {...header} />}

        {showSidebar && !header ? (
          <div className="flex items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-5">
            <SidebarMenuButton />
            <NotificationBell />
          </div>
        ) : null}

        <main
          className={cn(
            "flex flex-1 flex-col",
            centered
              ? "items-center justify-center px-6"
              : "overflow-y-auto px-5 pb-6",
            header ? "pt-4" : !showSidebar && "pt-[max(1rem,env(safe-area-inset-top))]",
            showSidebar && !header ? "pt-2" : null,
            showNav && "pb-2"
          )}
        >
          {!showSidebar && showNav && !header ? (
            <div className="mb-2 flex justify-end">
              <NotificationBell />
            </div>
          ) : null}
          <Outlet />
        </main>

        {showNav && <BottomNav />}
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <SidebarProvider>
      <AppShellContent />
    </SidebarProvider>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-start justify-center bg-navy p-0 sm:bg-surface sm:p-4">
      <div className="w-full max-w-5xl overflow-hidden bg-navy sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-black/50">
        {children}
      </div>
    </div>
  );
}
