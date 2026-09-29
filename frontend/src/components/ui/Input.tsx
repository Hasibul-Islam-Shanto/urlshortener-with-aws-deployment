import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type InputProps = {
  label: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id: string };

export const Input = ({ label, error, id, className, ...props }: InputProps) => {
  const messageId = error === undefined ? undefined : `${id}-error`;
  return (
    <div className="grid gap-space-2">
      <label htmlFor={id} className="text-xl font-medium text-text-on-card">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "min-h-11 w-full rounded-xs border border-border-card bg-black/25 px-space-5 text-xl text-text-on-card transition-colors duration-instant placeholder:text-text-on-card-muted hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60",
          error !== undefined && "border-danger",
          className,
        )}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={messageId}
        {...props}
      />
      {error !== undefined ? (
        <p id={`${id}-error`} className="text-xl text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
