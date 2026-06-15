import { Suspense, useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";
import { AppSidebar, SidebarMenuButton } from "../components/AppSidebar";
import { InstallPrompt } from "../components/InstallPrompt";
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
  const { closeMenu } = useSidebar();
  const { showNav, centered, header } = getRouteHandle(matches);
  const showAppMenu = isAuthenticated && !centered;

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  return (
    <div className="flex min-h-svh w-full bg-navy">
      {showAppMenu ? <AppSidebar /> : null}

      <div className="mx-auto flex min-h-svh w-full min-w-0 max-w-md flex-col md:shadow-2xl md:shadow-black/40">
        {header && <ShellHeader {...header} />}

        {showAppMenu && !header ? (
          <div className="flex items-center justify-end gap-2 px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <NotificationBell />
            <SidebarMenuButton />
          </div>
        ) : null}

        <main
          className={cn(
            "flex flex-1 flex-col",
            centered
              ? "items-center justify-center px-6"
              : "overflow-y-auto px-5 pb-6",
            header ? "pt-4" : !showAppMenu && "pt-[max(1rem,env(safe-area-inset-top))]",
            showAppMenu && !header ? "pt-2" : null,
            showNav && "pb-2"
          )}
        >
          {!showAppMenu && showNav && !header ? (
            <div className="mb-2 flex justify-end">
              <NotificationBell />
            </div>
          ) : null}
          {showAppMenu && showNav ? <InstallPrompt /> : null}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
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
    <div className="flex min-h-svh w-full bg-navy md:items-start md:justify-center md:bg-surface md:p-4">
      <div className="min-h-svh w-full bg-navy md:max-w-5xl md:overflow-hidden md:rounded-[2rem] md:border md:border-white/10 md:shadow-2xl md:shadow-black/50">
        {children}
      </div>
    </div>
  );
}
