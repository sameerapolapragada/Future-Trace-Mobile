import { NavLink, useLocation } from "react-router-dom";
import { cn } from "./utils";

const tabs = [
  { id: "home", to: "/home", label: "Home", icon: HomeIcon, isActive: (path: string) => path === "/home" },
  {
    id: "xray",
    to: "/xray-history",
    label: "Career X-Ray",
    icon: CareerXRayIcon,
    isActive: (path: string) =>
      path === "/xray-history" ||
      path.startsWith("/xray/") ||
      path.startsWith("/transition-paths/"),
  },
  {
    id: "transition",
    to: "/transition",
    label: "Transition",
    icon: TransitionIcon,
    isActive: (path: string) =>
      path === "/transition" ||
      path.startsWith("/transition/") ||
      path === "/notifications",
  },
  {
    id: "profile",
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
        {tabs.map(({ id, to, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <NavLink
              key={id}
              to={to!}
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

function CareerXRayIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
      {active && <circle cx="17" cy="7" r="2" fill="currentColor" opacity="0.45" />}
    </svg>
  );
}

function TransitionIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      {active && <circle cx="12" cy="12" r="9" opacity="0.2" fill="currentColor" />}
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
