import { cn } from "./utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "gradient";
  onClick?: () => void;
  padding?: "none" | "sm" | "md";
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
};

export function Card({
  children,
  className,
  variant = "default",
  onClick,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "default" && "ft-glass",
        variant === "elevated" && "ft-glass-elevated",
        variant === "gradient" &&
          "rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/20 via-navy-card/95 to-navy-card/90",
        paddingMap[padding],
        onClick &&
          "cursor-pointer transition hover:border-white/14 hover:shadow-glow active:scale-[0.99]",
        className
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
