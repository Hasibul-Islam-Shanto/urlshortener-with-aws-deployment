import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export const Badge = ({ children, className }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-xs border border-border-muted bg-surface-strong px-space-3 py-space-1 text-lg font-semibold tracking-wide text-text-tertiary uppercase",
      className,
    )}
  >
    {children}
  </span>
);
