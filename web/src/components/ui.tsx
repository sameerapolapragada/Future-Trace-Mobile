/** Legacy compatibility layer — prefer `import { … } from "../design-system"`. */
import {
  GhostButton,
  PrimaryButton,
  PrimaryButtonLink,
  SecondaryButton,
  SecondaryButtonLink,
} from "../design-system";

export {
  AppShell,
  PhoneFrame,
  BottomNav,
  ShellHeader as AppHeader,
  Card,
  ScoreCircle as ScoreRing,
  ProgressBar,
  RoleCard,
  SignalCard,
  SkillChip,
  SkillChipGroup,
  PaywallCard,
  SectionHeader,
  PageHeader,
  Badge,
  LogoMark,
  LogoMarkWithGlow,
} from "../design-system";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth, className, ...props }: ButtonProps) {
  if (variant === "secondary") {
    return <SecondaryButton fullWidth={fullWidth} className={className} {...props} />;
  }
  if (variant === "ghost") {
    return <GhostButton fullWidth={fullWidth} className={className} {...props} />;
  }
  return <PrimaryButton fullWidth={fullWidth} className={className} {...props} />;
}

type ButtonLinkProps = {
  to: string;
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  variant = "primary",
  fullWidth,
  className,
  to,
  children,
}: ButtonLinkProps) {
  if (variant === "secondary") {
    return (
      <SecondaryButtonLink to={to} fullWidth={fullWidth} className={className}>
        {children}
      </SecondaryButtonLink>
    );
  }
  return (
    <PrimaryButtonLink to={to} fullWidth={fullWidth} className={className}>
      {children}
    </PrimaryButtonLink>
  );
}
