import { Link } from "react-router-dom";
import { buttonBase, cn, fullWidthClass, type CommonProps } from "./utils";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

export function PrimaryButton({ fullWidth, className, children, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={cn(buttonBase, fullWidthClass(fullWidth), "ft-btn-primary", className)}
      {...props}
    >
      {children}
    </button>
  );
}

type PrimaryButtonLinkProps = CommonProps & {
  to: string;
  children: React.ReactNode;
};

export function PrimaryButtonLink({ to, fullWidth, className, children }: PrimaryButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(buttonBase, fullWidthClass(fullWidth), "ft-btn-primary", className)}
    >
      {children}
    </Link>
  );
}
