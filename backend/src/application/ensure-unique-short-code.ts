import { shortCodeGenerationError } from "../domain/errors.js";
import type { RepositoryError, ShortCodeGenerationError } from "../domain/errors.js";
import type { UrlRepository } from "../domain/url-repository.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export const MAX_GENERATION_ATTEMPTS = 5;

export type EnsureUniqueShortCodeDeps = {
  readonly findByShortCode: UrlRepository["findByShortCode"];
  readonly generateShortCode: () => string;
  readonly maxAttempts: number;
};

export const ensureUniqueShortCode = async ({
  findByShortCode,
  generateShortCode,
  maxAttempts,
}: EnsureUniqueShortCodeDeps): Promise<
  Result<string, ShortCodeGenerationError | RepositoryError>
> => {
  const attempt = async (
    attemptNumber: number,
  ): Promise<Result<string, ShortCodeGenerationError | RepositoryError>> => {
    if (attemptNumber > maxAttempts) {
      return err(shortCodeGenerationError(maxAttempts));
    }
    const candidate = generateShortCode();
    const existing = await findByShortCode(candidate);
    if (!existing.success) {
      return existing;
    }
    return existing.value === null ? ok(candidate) : attempt(attemptNumber + 1);
  };

  return attempt(1);
};
