import { cn } from "../lib/cn";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ft-focus-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function fullWidthClass(fullWidth?: boolean) {
  return fullWidth ? "w-full" : undefined;
}

export type CommonProps = {
  className?: string;
  fullWidth?: boolean;
};

export { cn };
