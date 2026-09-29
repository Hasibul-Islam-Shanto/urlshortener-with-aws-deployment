import { useCallback, useRef, useState, type ReactNode } from "react";

import { ToastContext } from "./toast-context";

type ToastItem = {
  id: number;
  message: string;
};

const TOAST_DURATION_MS = 4000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string) => {
    const id = nextId.current + 1;
    nextId.current = id;
    setToasts((current) => [...current.slice(-2), { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed right-space-6 bottom-space-6 z-50 grid max-w-sm gap-space-3"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className="surface-nav rounded-sm border border-border-muted px-space-5 py-space-4 text-xl font-medium text-text-tertiary shadow-1 transition-opacity duration-fast"
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
