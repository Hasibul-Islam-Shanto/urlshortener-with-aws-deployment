import { Inbox } from "lucide-react";

import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className="surface-card grid justify-items-start gap-space-4 rounded-sm border border-border-card p-space-8 text-text-on-card">
    <span className="flex size-12 items-center justify-center rounded-xs bg-primary/10 text-primary">
      <Inbox aria-hidden="true" className="size-6" strokeWidth={2} />
    </span>
    <p className="font-display text-4xl font-bold tracking-tight">{title}</p>
    <p className="text-xl text-text-on-card-muted">{description}</p>
    {actionLabel !== undefined && onAction !== undefined ? (
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
