import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const focusableElements = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(FOCUSABLE),
];

const keepFocusInside = (event: KeyboardEvent, root: HTMLElement | null): void => {
  if (event.key !== "Tab" || root === null) {
    return;
  }
  const focusable = focusableElements(root);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first === undefined || last === undefined) {
    event.preventDefault();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();
    if (dialog !== null) {
      dialog.dataset.state = "open";
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      keepFocusInside(event, dialogRef.current);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-space-6 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-state="opening"
        className="surface-card w-full max-w-md rounded-sm border border-border-card p-space-7 text-text-on-card transition-opacity duration-fast"
      >
        <h2 id={titleId} className="font-display text-4xl font-bold tracking-tight">
          {title}
        </h2>
        <div className="mt-space-5">{children}</div>
      </div>
    </div>
  );
};
