import { urlNotFoundError } from "../domain/errors.js";
import type {
  InvalidShortCodeError,
  RepositoryError,
  UrlNotFoundError,
} from "../domain/errors.js";
import type { UrlRepository } from "../domain/url-repository.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import { validateShortCode } from "../validation/url-schema.js";

export type ResolveShortUrlDeps = {
  readonly repository: UrlRepository;
};

export type ResolvedUrl = {
  readonly originalUrl: string;
};

export type ResolveShortUrlError =
  InvalidShortCodeError | UrlNotFoundError | RepositoryError;

export type ResolveShortUrl = (
  shortCode: unknown,
  userId?: string,
) => Promise<Result<ResolvedUrl, ResolveShortUrlError>>;

export const resolveShortUrl =
  ({ repository }: ResolveShortUrlDeps): ResolveShortUrl =>
  async (shortCode, userId) => {
    const validated = validateShortCode(shortCode);
    if (!validated.success) {
      return validated;
    }

    const found = await repository.findByShortCode(validated.value);
    if (!found.success) {
      return found;
    }

    const ownedByCaller = userId === undefined || found.value?.userId === userId;
    return found.value === null || !ownedByCaller
      ? err(urlNotFoundError(validated.value))
      : ok({ originalUrl: found.value.originalUrl });
  };
