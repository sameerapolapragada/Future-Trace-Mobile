import { NavLink, useLocation } from "react-router-dom";
import { cn } from "./utils";

const tabs = [
  { to: "/home", label: "Home", icon: HomeIcon, isActive: (path: string) => path === "/home" },
  {
    to: "/scan",
    label: "Scan",
    icon: ScanIcon,
    isActive: (path: string) => path === "/scan" || path === "/results" || path === "/canvas",
  },
  {
    to: "/radar",
    label: "Radar",
    icon: RadarIcon,
    isActive: (path: string) => path === "/radar",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: ProfileIcon,
    isActive: (path: string) => path === "/profile",
  },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="sticky bottom-0 z-50 border-t border-white/8 bg-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-2">
        {tabs.map(({ to, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition",
                active ? "text-accent" : "text-muted hover:text-white/80"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition",
                  active && "bg-accent/10"
                )}
              >
                <Icon active={active} />
              </span>
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.35" />}
    </svg>
  );
}

function RadarIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 18 8" strokeLinecap="round" />
      {active && (
        <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeLinecap="round" opacity="0.45" />
      )}
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" strokeLinecap="round" />
    </svg>
  );
}
