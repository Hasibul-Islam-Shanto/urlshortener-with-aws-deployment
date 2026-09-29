import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { PageFrame } from "../components/layout/PageFrame";

export const NotFoundPage = () => (
  <PageFrame centerMain>
    <div className="surface-card grid w-full max-w-md gap-space-4 rounded-sm border border-border-card p-space-8 text-text-on-card">
      <h1 className="font-display text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-xl text-text-on-card-muted">That page doesn't exist.</p>
      <Link
        to="/dashboard"
        className="inline-flex min-h-11 w-fit items-center gap-space-2 rounded-xs bg-primary px-space-6 text-xl font-semibold text-on-primary shadow-md transition-all duration-instant hover:brightness-110 active:translate-y-px"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to dashboard
      </Link>
    </div>
  </PageFrame>
);
