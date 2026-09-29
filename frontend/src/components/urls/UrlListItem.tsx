import { CopyButton } from "./CopyButton";
import { Button } from "../ui/Button";
import { formatCreatedAt } from "../../features/urls/format";
import { safeHttpUrl } from "../../features/urls/validation";
import type { UrlRecord } from "../../types/url";

type UrlListItemProps = {
  record: UrlRecord;
  shortUrl: string;
  onCopied?: () => void;
  onDelete: () => void;
};

export const UrlListItem = ({
  record,
  shortUrl,
  onCopied,
  onDelete,
}: UrlListItemProps) => {
  const original = safeHttpUrl(record.originalUrl);
  const created = formatCreatedAt(record.createdAt);

  return (
    <li className="grid gap-space-4 border-b border-border-card py-space-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_8rem_auto] md:items-center">
      <div className="min-w-0">
        <p className="text-lg tracking-wide text-text-on-card-muted uppercase md:sr-only">
          Short URL
        </p>
        <p className="truncate text-xl font-medium text-text-on-card" title={shortUrl}>
          <span className="sr-only">Shortened URL </span>
          {shortUrl}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-lg tracking-wide text-text-on-card-muted uppercase md:sr-only">
          Original URL
        </p>
        <p
          className="truncate text-xl text-text-on-card-muted"
          title={record.originalUrl}
        >
          <span className="sr-only">Original URL </span>
          {record.originalUrl}
        </p>
      </div>
      <p className="text-lg text-text-on-card-muted">
        <span className="sr-only">Created </span>
        <time dateTime={record.createdAt}>{created}</time>
      </p>
      <div className="flex flex-wrap items-center gap-space-3">
        <CopyButton
          value={shortUrl}
          label={`Copy shortened URL ${shortUrl}`}
          onCopied={onCopied}
        />
        {original !== null ? (
          <a
            href={original}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xs border border-border-card bg-surface-muted px-space-6 text-xl font-semibold text-text-on-card transition-all duration-instant hover:bg-surface-strong"
          >
            Open
          </a>
        ) : (
          <span className="text-lg text-text-on-card-muted">Open unavailable</span>
        )}
        <Button
          variant="destructive"
          aria-label={`Delete shortened URL ${shortUrl}`}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </li>
  );
};
