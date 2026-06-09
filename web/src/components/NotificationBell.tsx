import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { useNotifications } from "../lib/useTransitionData";
import { cn } from "../lib/cn";

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { entitlements } = useEntitlements();
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !entitlements.hasRadar) return;
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, entitlements.hasRadar, refresh]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!isAuthenticated || !entitlements.hasRadar) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-white/8 hover:text-white ft-focus-ring"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-navy-card p-2 shadow-xl">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            Transition reminders
          </p>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className={cn(
              "block rounded-lg px-2 py-2 text-sm text-accent transition hover:bg-white/5 ft-focus-ring",
              unreadCount > 0 && "font-medium"
            )}
          >
            {unreadCount > 0 ? `${unreadCount} unread` : "View all notifications"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
