import type { ReactNode } from "react";

type SectionHeadingProps = {
  icon: ReactNode;
  title: string;
  as?: "h1" | "h3";
};

export const SectionHeading = ({ icon, title, as: Tag = "h1" }: SectionHeadingProps) => (
  <Tag className="flex items-center gap-space-3 font-display text-4xl font-bold tracking-tight">
    <span className="flex size-10 items-center justify-center rounded-xs bg-primary/15 text-primary">
      {icon}
    </span>
    {title}
  </Tag>
);
