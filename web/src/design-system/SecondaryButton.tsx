import { Link } from "react-router-dom";
import { buttonBase, cn, fullWidthClass, type CommonProps } from "./utils";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

export function SecondaryButton({ fullWidth, className, children, ...props }: SecondaryButtonProps) {
  return (
    <button
      className={cn(buttonBase, fullWidthClass(fullWidth), "ft-btn-secondary", className)}
      {...props}
    >
      {children}
    </button>
  );
}

type SecondaryButtonLinkProps = CommonProps & {
  to: string;
  children: React.ReactNode;
};

export function SecondaryButtonLink({ to, fullWidth, className, children }: SecondaryButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(buttonBase, fullWidthClass(fullWidth), "ft-btn-secondary", className)}
    >
      {children}
    </Link>
  );
}

export function GhostButton({ fullWidth, className, children, ...props }: SecondaryButtonProps) {
  return (
    <button
      className={cn(buttonBase, fullWidthClass(fullWidth), "text-muted hover:text-white", className)}
      {...props}
    >
      {children}
    </button>
  );
}
