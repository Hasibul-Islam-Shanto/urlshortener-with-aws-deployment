import { ApiError, messageForStatus } from "./errors";

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
  fetchFn?: typeof fetch;
  onUnauthorized?: () => void;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

export type ApiClient = {
  request: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(500, messageForStatus(500));
  }
};

const requestHeaders = (
  getAccessToken: ApiClientConfig["getAccessToken"],
  hasBody: boolean,
): Headers => {
  const headers = new Headers({ Accept: "application/json" });
  const token = getAccessToken?.();
  if (token !== undefined && token !== "") {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
};

const fieldErrorsFrom = (value: unknown): Record<string, string> | undefined => {
  if (typeof value !== "object" || value === null || !("errors" in value)) {
    return undefined;
  }
  const errors = value.errors;
  if (typeof errors !== "object" || errors === null) {
    return undefined;
  }
  const fields: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    if (typeof message === "string" && message.length > 0 && message.length <= 200) {
      fields[key] = message;
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
};

const parseErrorBody = (text: string): unknown => {
  if (text.trim() === "") {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

/** Sign-in and sign-up return 401/409 as form errors, not as an expired session. */
const isCredentialRequest = (path: string): boolean =>
  path === "/auth/signin" || path === "/auth/signup";

export const createApiClient = ({
  baseUrl,
  getAccessToken,
  fetchFn = fetch,
  onUnauthorized,
}: ApiClientConfig): ApiClient => ({
  request: async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers: requestHeaders(getAccessToken, options.body !== undefined),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError(0, messageForStatus(0));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!response.ok) {
      if (response.status === 401 && !isCredentialRequest(path)) {
        onUnauthorized?.();
      }
      throw new ApiError(
        response.status,
        messageForStatus(response.status),
        fieldErrorsFrom(parseErrorBody(text)),
      );
    }
    if (text.trim() === "") {
      return undefined as T;
    }
    return readJson(text) as T;
  },
});
