import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary shadow-md hover:brightness-110 hover:shadow-lg",
  secondary:
    "border border-border-card bg-surface-muted text-text-on-card shadow-sm hover:bg-surface-strong",
  destructive:
    "bg-danger-strong text-on-danger shadow-sm hover:bg-danger hover:text-on-danger",
  ghost:
    "bg-transparent text-text-inverse hover:bg-surface-strong hover:text-text-tertiary",
};

export const Button = ({
  variant = "primary",
  loading = false,
  className,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex min-h-11 items-center justify-center gap-space-2 rounded-xs px-space-6 text-xl font-semibold transition-all duration-instant active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className,
    )}
    disabled={disabled === true || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {children}
  </button>
);
