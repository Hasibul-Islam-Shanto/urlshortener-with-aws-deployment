import { useCallback } from "react";

import { PageFrame } from "../components/layout/PageFrame";
import { UrlForm } from "../components/urls/UrlForm";
import { UrlList } from "../components/urls/UrlList";
import { useToast } from "../components/ui/toast-context";
import { env } from "../config/env";
import { useAuth } from "../features/auth/auth-context";
import { useUrlList } from "../features/urls/use-url-list";
import { buildShortUrl } from "../services/api/urls";

const focusUrlInput = (): void => {
  document.getElementById("long-url")?.focus();
};

export const DashboardPage = () => {
  const toast = useToast();
  const { urlsApi } = useAuth();

  const listUrls = useCallback(() => urlsApi.listUrls(), [urlsApi]);
  const { state, retry, reload } = useUrlList({ listUrls });
  const shortUrlFor = useCallback(
    (shortCode: string) => buildShortUrl(env.apiBaseUrl, shortCode),
    [],
  );

  return (
    <PageFrame>
      <div className="mx-auto grid w-full max-w-3xl gap-space-8">
        <UrlForm
          shortUrlFor={shortUrlFor}
          onCreated={() => {
            toast("URL created");
          }}
          onCopied={() => {
            toast("URL copied");
          }}
          onCreate={async (url) => {
            const created = await urlsApi.createUrl(url);
            await reload();
            return created;
          }}
        />
        <UrlList
          state={state}
          shortUrlFor={shortUrlFor}
          onRetry={retry}
          onCreateFirst={focusUrlInput}
          onCopied={() => {
            toast("URL copied");
          }}
          onDelete={(shortCode) => urlsApi.deleteUrl(shortCode)}
          onDeleted={() => {
            toast("URL deleted");
            void reload();
          }}
        />
      </div>
    </PageFrame>
  );
};
