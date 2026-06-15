import { Link, useLocation } from "react-router-dom";
import { LogoMark } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { useSidebar } from "../lib/SidebarContext";
import { useSidebarNav, type SidebarNavItem } from "../lib/useSidebarNav";
import { cn } from "../lib/cn";

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isNavActive(pathname: string, id: string): boolean {
  if (id === "dashboard") return pathname === "/home";
  if (id === "scan") return pathname === "/scan" || pathname.startsWith("/results/");
  if (id === "xray")
    return pathname === "/xray-history" || pathname.startsWith("/xray/") || pathname.startsWith("/transition-paths/");
  if (id === "transition")
    return pathname === "/transition" || (pathname.startsWith("/transition") && !pathname.includes("/plan/") && !pathname.includes("/week/"));
  if (id === "plan") return pathname.startsWith("/transition/plan/");
  if (id === "milestones") return pathname.startsWith("/transition/week/");
  if (id === "notifications") return pathname === "/notifications";
  if (id === "profile") return pathname === "/profile";
  return false;
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { entitlements } = useEntitlements();
  const { menuOpen, closeMenu } = useSidebar();
  const { items } = useSidebarNav();

  if (!isAuthenticated) return null;

  const renewal = formatRenewalDate(entitlements.subscriptionExpiresAt);

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMenu}
        />
      ) : null}

      <aside
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(300px,88vw)] flex-col border-l border-white/8 bg-[#0a0a0f] shadow-2xl shadow-black/50 transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-white/6 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} className="shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">Future Trace</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/8 ft-focus-ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="Main menu">
          {items.map((item) => (
            <MenuLink
              key={item.id}
              item={item}
              active={isNavActive(pathname, item.id)}
              onNavigate={closeMenu}
            />
          ))}
        </nav>

        {entitlements.hasRadar ? (
          <div className="border-t border-white/6 p-3">
            <div className="rounded-xl border border-accent-purple/25 bg-navy-card/80 p-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-accent-purple">AI Career Transition</p>
                <span className="rounded border border-accent-gold/40 px-1 py-0.5 text-[8px] font-bold uppercase text-accent-gold">
                  Pro
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted">Active</p>
              {renewal ? <p className="text-[10px] text-muted">Renews on {renewal}</p> : null}
              <Link
                to="/profile"
                onClick={closeMenu}
                className="mt-3 block w-full rounded-lg bg-accent-purple/20 py-2 text-center text-[11px] font-semibold text-white transition hover:bg-accent-purple/30 ft-focus-ring"
              >
                Manage Plan
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function MenuLink({
  item,
  active,
  onNavigate,
}: {
  item: SidebarNavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition ft-focus-ring",
        active ? "bg-accent-purple/20 text-white" : "text-muted hover:bg-white/5 hover:text-white"
      )}
    >
      <NavIcon id={item.id} active={active} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.label}</span>
      {item.badge ? <NavBadge badge={item.badge} /> : null}
    </Link>
  );
}

function NavBadge({ badge }: { badge: { text: string; tone: "free" | "price" | "pro" | "count" } }) {
  const tones = {
    free: "bg-accent/20 text-accent",
    price: "bg-white/10 text-muted",
    pro: "border border-accent-gold/50 text-accent-gold",
    count: "bg-danger text-white min-w-[18px] justify-center",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        tones[badge.tone],
        badge.tone === "count" && "flex h-[18px] items-center rounded-full px-1"
      )}
    >
      {badge.text}
    </span>
  );
}

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const className = cn("shrink-0", active ? "text-accent-purple" : "text-muted");
  const size = 18;

  switch (id) {
    case "dashboard":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="5" rx="1" />
          <rect x="13" y="10" width="8" height="11" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
        </svg>
      );
    case "scan":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="11" cy="11" r="7" strokeDasharray="3 3" />
          <path d="M16 16l5 5" strokeLinecap="round" />
        </svg>
      );
    case "xray":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3" />
          <path d="M8 18c1-2 2.5-3 4-3s3 1 4 3" />
        </svg>
      );
    case "transition":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M15 4V2M15 4h-2M15 4v2M9 20v2M9 20h2M9 20v-2" strokeLinecap="round" />
          <path d="M12 6l2 6-6 2 2-6 6-2-2 6-6 2 2-6z" />
        </svg>
      );
    case "plan":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M5 4v16M5 4h12l-3 4 3 4H5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "milestones":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3z" />
          <path d="M5 14l2 4 4 1-3 3" strokeLinecap="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function SidebarMenuButton() {
  const { toggleMenu } = useSidebar();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      onClick={toggleMenu}
      aria-label="Open menu"
      className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/8 ft-focus-ring"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      </svg>
    </button>
  );
}
