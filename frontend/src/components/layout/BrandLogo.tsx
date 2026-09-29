import { Link2 } from "lucide-react";
import { Link } from "react-router-dom";

type BrandLogoProps = {
  to: string;
};

export const BrandLogo = ({ to }: BrandLogoProps) => (
  <Link
    to={to}
    className="group flex min-h-11 shrink-0 items-center gap-space-3 pr-space-2 transition-opacity duration-instant hover:opacity-90"
  >
    <span className="flex size-9 items-center justify-center rounded-xs bg-primary shadow-md ring-2 ring-white/20">
      <Link2 aria-hidden="true" className="size-5 text-on-primary" strokeWidth={2.5} />
    </span>
    <span className="font-display text-2xl font-bold tracking-tight text-text-tertiary">
      URLshort
    </span>
  </Link>
);
