import { cn } from "./utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 64, className }: LogoMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="Future Trace"
      draggable={false}
      className={cn("block shrink-0 object-contain p-0 m-0", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function LogoMarkWithGlow({ size = 64, className }: LogoMarkProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center p-0", className)}>
      <div
        className="pointer-events-none absolute rounded-full bg-accent/20 blur-2xl"
        style={{ width: size * 1.4, height: size * 1.4 }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute rounded-full bg-accent-purple/15 blur-2xl"
        style={{ width: size * 1.2, height: size * 1.2 }}
        aria-hidden
      />
      <LogoMark size={size} className="relative" />
    </div>
  );
}
