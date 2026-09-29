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

export type DeleteShortUrlDeps = {
  readonly repository: UrlRepository;
};

export type DeleteShortUrlError =
  InvalidShortCodeError | UrlNotFoundError | RepositoryError;

export type DeleteShortUrl = (
  shortCode: unknown,
  userId: string,
) => Promise<Result<void, DeleteShortUrlError>>;

export const deleteShortUrl =
  ({ repository }: DeleteShortUrlDeps): DeleteShortUrl =>
  async (shortCode, userId) => {
    const validated = validateShortCode(shortCode);
    if (!validated.success) {
      return validated;
    }

    const found = await repository.findByShortCode(validated.value);
    if (!found.success) {
      return found;
    }
    // Missing and someone else's URLs look the same, so callers cannot enumerate them.
    if (found.value?.userId !== userId) {
      return err(urlNotFoundError(validated.value));
    }

    const deleted = await repository.deleteByShortCode(validated.value);
    if (!deleted.success) {
      return deleted;
    }

    return deleted.value ? ok(undefined) : err(urlNotFoundError(validated.value));
  };
