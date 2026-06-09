import { useNavigate } from "react-router-dom";
import { PageHeader } from "../design-system";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/transition/notificationService";
import { formatDateTime } from "../lib/transition/milestoneUi";
import { useNotifications } from "../lib/useTransitionData";
import { useAuth } from "../auth/useAuth";
import { cn } from "../lib/cn";
import type { TransitionNotification } from "../types/transition";

export default function NotificationsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { items, loading, refresh } = useNotifications();

  const unread = items.filter((n) => n.status === "sent" && !n.readAt);
  const scheduled = items.filter((n) => n.status === "scheduled");
  const past = items.filter((n) => n.status === "sent" && n.readAt);

  async function handleOpen(notification: TransitionNotification) {
    if (notification.status === "sent" && !notification.readAt) {
      await markNotificationRead(notification.id);
    }
    await refresh();
    if (notification.planUpdateId) {
      navigate(`/transition/plan-updates/${notification.planUpdateId}`);
    } else if (notification.milestoneId) {
      navigate(`/transition/week/${notification.milestoneId}`);
    } else {
      navigate("/transition");
    }
  }

  async function handleMarkAllRead() {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Notifications" subtitle="Transition reminders and updates" backTo="/transition" />
        {unread.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="shrink-0 text-xs font-medium text-accent transition hover:text-accent-soft ft-focus-ring"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <NotificationSection title="Unread" empty="No unread notifications">
        {unread.map((n) => (
          <NotificationRow key={n.id} notification={n} onOpen={() => void handleOpen(n)} unread />
        ))}
      </NotificationSection>

      <NotificationSection title="Scheduled" empty="No upcoming reminders">
        {scheduled.map((n) => (
          <NotificationRow key={n.id} notification={n} onOpen={() => void handleOpen(n)} />
        ))}
      </NotificationSection>

      <NotificationSection title="Past" empty="No past notifications yet">
        {past.map((n) => (
          <NotificationRow key={n.id} notification={n} onOpen={() => void handleOpen(n)} />
        ))}
      </NotificationSection>
    </div>
  );
}

function NotificationSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-white">{title}</h2>
      {hasItems ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        <p className="rounded-xl border border-white/6 bg-navy-card px-3 py-4 text-xs text-muted">{empty}</p>
      )}
    </section>
  );
}

function NotificationRow({
  notification,
  onOpen,
  unread,
}: {
  notification: TransitionNotification;
  onOpen: () => void;
  unread?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full rounded-xl border p-3 text-left transition ft-focus-ring",
          unread ? "border-accent/30 bg-accent/5" : "border-white/8 bg-navy-card hover:border-white/15"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{notification.message}</p>
        <p className="mt-2 text-[10px] text-muted">
          {notification.status === "scheduled" ? "Scheduled · " : ""}
          {formatDateTime(notification.scheduledFor)}
        </p>
      </button>
    </li>
  );
}
