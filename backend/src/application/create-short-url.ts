import type {
  InvalidUrlError,
  RepositoryError,
  ShortCodeGenerationError,
} from "../domain/errors.js";
import { createUrlRecord } from "../domain/url.js";
import type { UrlRecord } from "../domain/url.js";
import type { UrlRepository } from "../domain/url-repository.js";
import { ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import type { Clock } from "../utils/clock.js";
import { validateCreateShortUrlInput } from "../validation/url-schema.js";
import {
  ensureUniqueShortCode,
  MAX_GENERATION_ATTEMPTS,
} from "./ensure-unique-short-code.js";

export type CreateShortUrlDeps = {
  readonly repository: UrlRepository;
  readonly generateShortCode: () => string;
  readonly now: Clock;
  readonly maxAttempts?: number;
};

export type CreateShortUrlError =
  InvalidUrlError | ShortCodeGenerationError | RepositoryError;

export type CreateShortUrl = (
  input: unknown,
  userId: string,
) => Promise<Result<UrlRecord, CreateShortUrlError>>;

export const createShortUrl =
  ({
    repository,
    generateShortCode,
    now,
    maxAttempts = MAX_GENERATION_ATTEMPTS,
  }: CreateShortUrlDeps): CreateShortUrl =>
  async (input, userId) => {
    const validated = validateCreateShortUrlInput(input);
    if (!validated.success) {
      return validated;
    }

    const shortCode = await ensureUniqueShortCode({
      findByShortCode: repository.findByShortCode,
      generateShortCode,
      maxAttempts,
    });
    if (!shortCode.success) {
      return shortCode;
    }

    const record = createUrlRecord({
      shortCode: shortCode.value,
      originalUrl: validated.value.url,
      createdAt: now(),
      userId,
    });

    const saved = await repository.save(record);
    return saved.success ? ok(record) : saved;
  };
