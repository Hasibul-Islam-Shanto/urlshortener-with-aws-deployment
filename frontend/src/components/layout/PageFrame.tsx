import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Header } from "./Header";

type PageFrameProps = {
  children: ReactNode;
  centerMain?: boolean;
  mainClassName?: string;
};

export const PageFrame = ({
  children,
  centerMain = false,
  mainClassName,
}: PageFrameProps) => (
  <div className="app-shell min-h-dvh text-text-primary">
    <Header />
    <main
      id="main"
      className={cn(
        "mx-auto w-full max-w-5xl px-space-7 pb-space-10 pt-space-2 sm:px-space-8",
        centerMain &&
          "flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center",
        mainClassName,
      )}
    >
      {children}
    </main>
  </div>
);
