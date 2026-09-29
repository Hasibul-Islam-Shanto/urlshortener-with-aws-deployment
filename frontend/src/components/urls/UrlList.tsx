import { useState } from "react";

import type { UrlListState } from "../../features/urls/use-url-list";
import type { UrlRecord } from "../../types/url";
import { DeleteUrlDialog } from "./DeleteUrlDialog";
import { UrlListContent, UrlListHeading } from "./UrlListContent";

const DELETE_ERROR = "We couldn't delete this URL. Please try again.";

type UrlListProps = {
  state: UrlListState;
  shortUrlFor: (shortCode: string) => string;
  onRetry: () => void;
  onCreateFirst: () => void;
  onCopied?: () => void;
  onDelete: (shortCode: string) => Promise<void>;
  onDeleted?: () => void;
};

const readyCount = (state: UrlListState): number | undefined =>
  state.status === "ready" ? state.items.length : undefined;

export const UrlList = ({
  state,
  shortUrlFor,
  onRetry,
  onCreateFirst,
  onCopied,
  onDelete,
  onDeleted,
}: UrlListProps) => {
  const [pending, setPending] = useState<UrlRecord | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  const closeDialog = () => {
    if (deleting) {
      return;
    }
    setPending(undefined);
    setDeleteError(undefined);
  };

  const confirmDelete = async () => {
    if (pending === undefined || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await onDelete(pending.shortCode);
    } catch {
      setDeleteError(DELETE_ERROR);
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setPending(undefined);
    onDeleted?.();
  };

  return (
    <section id="urls" className="grid gap-space-5" aria-labelledby="your-urls-heading">
      <UrlListHeading count={readyCount(state)} />
      <UrlListContent
        state={state}
        shortUrlFor={shortUrlFor}
        onRetry={onRetry}
        onCreateFirst={onCreateFirst}
        onCopied={onCopied}
        onRequestDelete={(record) => {
          setDeleteError(undefined);
          setPending(record);
        }}
      />
      <DeleteUrlDialog
        shortUrl={pending === undefined ? undefined : shortUrlFor(pending.shortCode)}
        deleting={deleting}
        error={deleteError}
        onCancel={closeDialog}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </section>
  );
};
