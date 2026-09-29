import { emailInitials } from "../../features/auth/email-initials";
import { cn } from "../../lib/cn";

type UserAvatarProps = {
  email: string;
  /** When true, accessibility name comes from a parent control (e.g. menu trigger). */
  decorative?: boolean;
  className?: string;
};

export const UserAvatar = ({ email, decorative = false, className }: UserAvatarProps) => (
  <span
    className={cn(
      "flex size-9 shrink-0 items-center justify-center rounded-xs bg-primary/25 font-display text-lg font-bold uppercase text-on-primary ring-2 ring-primary/35",
      className,
    )}
    title={decorative ? undefined : email}
    aria-hidden={decorative ? true : undefined}
    aria-label={decorative ? undefined : `Signed in as ${email}`}
  >
    {emailInitials(email)}
  </span>
);
