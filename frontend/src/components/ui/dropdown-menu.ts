import { useEffect, type RefObject } from "react";

const menuButtons = (root: HTMLElement | null): HTMLButtonElement[] => [
  ...(root?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []),
];

export const enabledMenuButtons = (root: HTMLElement | null): HTMLButtonElement[] =>
  menuButtons(root).filter((button) => !button.disabled);

export const focusMenuButton = (root: HTMLElement | null, index: number): void => {
  const enabled = enabledMenuButtons(root);
  if (enabled.length === 0) {
    return;
  }
  const next = ((index % enabled.length) + enabled.length) % enabled.length;
  enabled[next]?.focus();
};

export const useDismissOnOutsidePointer = (
  open: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        rootRef.current !== null &&
        !rootRef.current.contains(event.target)
      ) {
        onDismiss();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onDismiss, rootRef]);
};
