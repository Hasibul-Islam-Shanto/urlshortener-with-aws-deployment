import { createContext, useContext } from "react";

export type ToastContextValue = (message: string) => void;

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const show = useContext(ToastContext);
  if (show === null) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return show;
};
