import { cn } from "../../lib/cn";

type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn("animate-pulse rounded-xs bg-surface-strong", className)}
    aria-hidden="true"
  />
);
