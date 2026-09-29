import { List } from "lucide-react";

import type { UrlListState } from "../../features/urls/use-url-list";
import type { UrlRecord } from "../../types/url";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";
import { UrlListItem } from "./UrlListItem";
import { UrlStats } from "./UrlStats";

const SKELETON_ROWS = [0, 1, 2] as const;

type UrlListContentProps = {
  state: UrlListState;
  shortUrlFor: (shortCode: string) => string;
  onRetry: () => void;
  onCreateFirst: () => void;
  onCopied?: () => void;
  onRequestDelete: (record: UrlRecord) => void;
};

const UrlListLoading = () => (
  <div role="status" aria-label="Loading your URLs" className="grid gap-space-4">
    <span className="sr-only">Loading your URLs</span>
    {SKELETON_ROWS.map((row) => (
      <div key={row} className="grid gap-space-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    ))}
  </div>
);

const UrlListError = ({ onRetry }: { onRetry: () => void }) => (
  <div
    className="surface-card grid justify-items-start gap-space-4 rounded-sm border border-border-card px-space-8 py-space-8 text-text-on-card"
    role="alert"
  >
    <h3 className="font-display text-4xl font-bold">We couldn't load your URLs.</h3>
    <p className="text-xl text-text-on-card-muted">Please try again.</p>
    <Button variant="secondary" onClick={onRetry}>
      Try again
    </Button>
  </div>
);

const UrlListTable = ({
  items,
  shortUrlFor,
  onCopied,
  onRequestDelete,
}: {
  items: readonly UrlRecord[];
  shortUrlFor: (shortCode: string) => string;
  onCopied?: () => void;
  onRequestDelete: (record: UrlRecord) => void;
}) => (
  <div className="surface-card overflow-hidden rounded-sm border border-border-card px-space-6 text-text-on-card">
    <div className="hidden border-b border-border-card py-space-4 text-lg font-medium tracking-wide text-text-on-card-muted uppercase md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_8rem_auto]">
      <span>Short URL</span>
      <span>Original URL</span>
      <span>Created</span>
      <span className="sr-only">Actions</span>
    </div>
    <ul>
      {items.map((record) => (
        <UrlListItem
          key={record.shortCode}
          record={record}
          shortUrl={shortUrlFor(record.shortCode)}
          onCopied={onCopied}
          onDelete={() => {
            onRequestDelete(record);
          }}
        />
      ))}
    </ul>
  </div>
);

export const UrlListHeading = ({ count }: { count: number | undefined }) => (
  <div className="flex flex-wrap items-center justify-between gap-space-3">
    <h3
      id="your-urls-heading"
      className="flex items-center gap-space-3 font-display text-4xl font-bold tracking-tight text-text-tertiary"
    >
      <span className="flex size-9 items-center justify-center rounded-xs bg-surface-strong">
        <List aria-hidden="true" className="size-4" strokeWidth={2.25} />
      </span>
      Your URLs
    </h3>
    {count !== undefined && count > 0 ? <UrlStats count={count} /> : null}
  </div>
);

export const UrlListContent = ({
  state,
  shortUrlFor,
  onRetry,
  onCreateFirst,
  onCopied,
  onRequestDelete,
}: UrlListContentProps) => {
  if (state.status === "loading") {
    return <UrlListLoading />;
  }
  if (state.status === "error") {
    return <UrlListError onRetry={onRetry} />;
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        title="No shortened URLs yet"
        description="Create your first short URL to get started."
        actionLabel="Shorten a URL"
        onAction={onCreateFirst}
      />
    );
  }
  return (
    <UrlListTable
      items={state.items}
      shortUrlFor={shortUrlFor}
      onCopied={onCopied}
      onRequestDelete={onRequestDelete}
    />
  );
};
