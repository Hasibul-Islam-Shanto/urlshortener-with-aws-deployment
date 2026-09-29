import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  enabledMenuButtons,
  focusMenuButton,
  useDismissOnOutsidePointer,
} from "./dropdown-menu";

export type DropdownItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  icon?: ReactNode;
};

type DropdownProps = {
  label: string;
  items: readonly DropdownItem[];
  summary?: ReactNode;
  children: ReactNode;
};

export const Dropdown = ({ label, items, summary, children }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useDismissOnOutsidePointer(open, rootRef, close);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      window.setTimeout(() => {
        focusMenuButton(rootRef.current, 0);
      }, 0);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    const enabled = enabledMenuButtons(rootRef.current);
    const current = enabled.findIndex((button) => button === document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMenuButton(rootRef.current, current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMenuButton(rootRef.current, current - 1);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onMenuKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex min-h-11 max-w-full items-center gap-space-3 rounded-xs p-space-1 text-left transition-colors duration-instant hover:bg-surface-strong"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => {
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {children}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="surface-nav absolute top-full right-0 z-30 mt-space-2 min-w-56 rounded-sm border border-border-muted p-space-2 shadow-1"
        >
          {summary !== undefined ? (
            <div
              className="grid gap-space-1 px-space-4 py-space-3"
              role="group"
              aria-label="Account"
            >
              {summary}
            </div>
          ) : null}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className="flex min-h-11 w-full items-center gap-space-2 rounded-xs px-space-4 text-left text-xl text-text-primary transition-colors duration-instant hover:bg-surface-strong focus-visible:bg-surface-strong disabled:cursor-not-allowed disabled:text-text-inverse"
              onClick={() => {
                if (item.disabled === true) {
                  return;
                }
                close();
                item.onSelect();
              }}
            >
              {item.icon ?? null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
