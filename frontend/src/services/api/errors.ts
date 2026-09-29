export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Readonly<Record<string, string>> | undefined;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const messageForStatus = (status: number): string => {
  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return "Authentication required";
    case 403:
      return "Not authorized";
    case 404:
      return "Resource not found";
    case 409:
      return "Conflict";
    case 429:
      return "Too many requests";
    default:
      return status >= 500 || status === 0 ? "Server error" : "Request failed";
  }
};
