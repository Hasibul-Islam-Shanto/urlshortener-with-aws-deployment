import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <section
    className={cn(
      "surface-card w-full rounded-sm border border-border-card p-space-8 text-text-on-card",
      className,
    )}
  >
    {children}
  </section>
);
