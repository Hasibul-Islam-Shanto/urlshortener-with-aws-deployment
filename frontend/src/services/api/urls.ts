import type { ApiClient } from "./client";
import { ApiError, messageForStatus } from "./errors";
import type { CreateUrlResponse, UrlRecord } from "../../types/url";

const isRecord = (value: unknown): value is UrlRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.shortCode === "string" &&
    typeof record.originalUrl === "string" &&
    typeof record.createdAt === "string"
  );
};

const isCreateResponse = (value: unknown): value is CreateUrlResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.shortCode === "string" && typeof record.originalUrl === "string";
};

export const parseUrlList = (value: unknown): UrlRecord[] => {
  if (typeof value !== "object" || value === null || !("items" in value)) {
    throw new ApiError(500, messageForStatus(500));
  }
  const items = value.items;
  if (!Array.isArray(items) || !items.every(isRecord)) {
    throw new ApiError(500, messageForStatus(500));
  }
  return items;
};

export const parseCreateUrl = (value: unknown): CreateUrlResponse => {
  if (!isCreateResponse(value)) {
    throw new ApiError(500, messageForStatus(500));
  }
  return value;
};

export const buildShortUrl = (base: string, shortCode: string): string =>
  `${base.replace(/\/+$/, "")}/${shortCode}`;

export type UrlsApi = {
  createUrl: (url: string) => Promise<CreateUrlResponse>;
  listUrls: () => Promise<UrlRecord[]>;
  deleteUrl: (shortCode: string) => Promise<void>;
};

export const createUrlsApi = (client: ApiClient): UrlsApi => ({
  createUrl: async (url) =>
    parseCreateUrl(
      await client.request<unknown>("/urls", { method: "POST", body: { url } }),
    ),
  listUrls: async () => parseUrlList(await client.request<unknown>("/urls")),
  deleteUrl: async (shortCode) => {
    await client.request<undefined>(`/urls/${encodeURIComponent(shortCode)}`, {
      method: "DELETE",
    });
  },
});
