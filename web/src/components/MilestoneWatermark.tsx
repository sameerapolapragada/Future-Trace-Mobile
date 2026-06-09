import { useAuth } from "../auth/useAuth";

export function MilestoneWatermark() {
  const { user, userId } = useAuth();
  const label = user?.email ?? userId?.slice(0, 8) ?? "member";
  const date = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <p
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center select-none text-[11px] tracking-wide text-white/[0.04] rotate-[-18deg]"
      aria-hidden
    >
      Future Trace • {label} • {date}
    </p>
  );
}
