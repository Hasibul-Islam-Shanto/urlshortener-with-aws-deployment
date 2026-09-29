import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type DeleteUrlDialogProps = {
  shortUrl: string | undefined;
  deleting: boolean;
  error: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteUrlDialog = ({
  shortUrl,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteUrlDialogProps) => (
  <Modal
    open={shortUrl !== undefined}
    title="Delete shortened URL?"
    onClose={() => {
      if (!deleting) {
        onCancel();
      }
    }}
  >
    <div className="grid gap-space-5">
      <p className="text-xl text-text-on-card-muted">This will permanently remove:</p>
      <p className="truncate text-xl font-medium text-text-on-card" title={shortUrl}>
        {shortUrl}
      </p>
      <p className="text-xl text-text-on-card-muted">This action cannot be undone.</p>
      {error === undefined ? null : (
        <p className="text-xl text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-space-3">
        <Button variant="secondary" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="destructive" loading={deleting} onClick={onConfirm}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  </Modal>
);
