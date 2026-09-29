export type InvalidUrlError = {
  readonly type: "InvalidUrl";
  readonly message: string;
  readonly issues: readonly string[];
};

export type InvalidShortCodeError = {
  readonly type: "InvalidShortCode";
  readonly message: string;
};

export type UrlNotFoundError = {
  readonly type: "UrlNotFound";
  readonly message: string;
  readonly shortCode: string;
};

export type ShortCodeGenerationError = {
  readonly type: "ShortCodeGeneration";
  readonly message: string;
  readonly attempts: number;
};

/**
 * `cause` holds the underlying infrastructure error for logging only;
 * it must never be exposed to API clients.
 */
export type RepositoryError = {
  readonly type: "Repository";
  readonly message: string;
  readonly reason?: "DuplicateShortCode" | "DuplicateEmail";
  readonly cause?: unknown;
};

export type ValidationFailedError = {
  readonly type: "ValidationFailed";
  readonly message: "Validation failed";
  readonly errors: Readonly<Record<string, string>>;
};

export type EmailAlreadyExistsError = {
  readonly type: "EmailAlreadyExists";
  readonly message: "An account with this email already exists";
};

export type InvalidCredentialsError = {
  readonly type: "InvalidCredentials";
  readonly message: "Invalid email or password";
};

export type UnauthenticatedError = {
  readonly type: "Unauthenticated";
  readonly message: string;
};

export type AppError =
  | InvalidUrlError
  | InvalidShortCodeError
  | UrlNotFoundError
  | ShortCodeGenerationError
  | RepositoryError
  | ValidationFailedError
  | EmailAlreadyExistsError
  | InvalidCredentialsError
  | UnauthenticatedError;

export const invalidUrlError = (issues: readonly string[]): InvalidUrlError => ({
  type: "InvalidUrl",
  message: "The provided URL is invalid",
  issues,
});

export const invalidShortCodeError = (): InvalidShortCodeError => ({
  type: "InvalidShortCode",
  message: "The provided short code is invalid",
});

export const urlNotFoundError = (shortCode: string): UrlNotFoundError => ({
  type: "UrlNotFound",
  message: `No URL found for short code "${shortCode}"`,
  shortCode,
});

export const shortCodeGenerationError = (attempts: number): ShortCodeGenerationError => ({
  type: "ShortCodeGeneration",
  message: `Could not generate a unique short code after ${String(attempts)} attempts`,
  attempts,
});

export const repositoryError = (cause?: unknown): RepositoryError => ({
  type: "Repository",
  message: "A storage error occurred",
  ...(cause === undefined ? {} : { cause }),
});

export const duplicateShortCodeError = (
  shortCode: string,
  cause?: unknown,
): RepositoryError => ({
  type: "Repository",
  message: `Short code "${shortCode}" already exists`,
  reason: "DuplicateShortCode",
  ...(cause === undefined ? {} : { cause }),
});

export const duplicateEmailError = (cause?: unknown): RepositoryError => ({
  type: "Repository",
  message: "An account with this email already exists",
  reason: "DuplicateEmail",
  ...(cause === undefined ? {} : { cause }),
});

export const validationFailedError = (
  errors: Readonly<Record<string, string>>,
): ValidationFailedError => ({
  type: "ValidationFailed",
  message: "Validation failed",
  errors,
});

export const emailAlreadyExistsError = (): EmailAlreadyExistsError => ({
  type: "EmailAlreadyExists",
  message: "An account with this email already exists",
});

export const invalidCredentialsError = (): InvalidCredentialsError => ({
  type: "InvalidCredentials",
  message: "Invalid email or password",
});

export const unauthenticatedError = (
  message = "Authentication required",
): UnauthenticatedError => ({
  type: "Unauthenticated",
  message,
});
