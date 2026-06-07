import { cn } from "./utils";

type SkillChipProps = {
  label: string;
  tone?: "default" | "accent" | "success";
  size?: "sm" | "md";
  className?: string;
};

export function SkillChip({ label, tone = "default", size = "sm", className }: SkillChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        tone === "default" && "border border-white/10 bg-white/5 text-white/85",
        tone === "accent" && "border border-accent/25 bg-accent/10 text-accent-soft",
        tone === "success" && "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        className
      )}
    >
      {label}
    </span>
  );
}

export function SkillChipGroup({
  skills,
  tone,
  className,
}: {
  skills: string[];
  tone?: SkillChipProps["tone"];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {skills.map((skill) => (
        <SkillChip key={skill} label={skill} tone={tone} />
      ))}
    </div>
  );
}
