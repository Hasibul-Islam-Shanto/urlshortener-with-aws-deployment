export { createApp, createAuthApp, createDynamoDbApp } from "./composition.js";
export type {
  App,
  AppOptions,
  AuthApp,
  AuthAppOptions,
  VerifyAccessToken,
} from "./composition.js";
export { loadDynamoDbConfig, loadLambdaConfig } from "./config.js";
export type { DynamoDbConfig, LambdaConfig } from "./config.js";

export { createShortUrl } from "./application/create-short-url.js";
export type {
  CreateShortUrl,
  CreateShortUrlDeps,
  CreateShortUrlError,
} from "./application/create-short-url.js";
export { resolveShortUrl } from "./application/resolve-short-url.js";
export type {
  ResolveShortUrl,
  ResolveShortUrlDeps,
  ResolveShortUrlError,
  ResolvedUrl,
} from "./application/resolve-short-url.js";
export { listShortUrls } from "./application/list-short-urls.js";
export type { ListShortUrls, ListShortUrlsDeps } from "./application/list-short-urls.js";
export { deleteShortUrl } from "./application/delete-short-url.js";
export type {
  DeleteShortUrl,
  DeleteShortUrlDeps,
  DeleteShortUrlError,
} from "./application/delete-short-url.js";
export {
  ensureUniqueShortCode,
  MAX_GENERATION_ATTEMPTS,
} from "./application/ensure-unique-short-code.js";

export { createUrlRecord } from "./domain/url.js";
export type { UrlRecord } from "./domain/url.js";
export type { UrlRepository } from "./domain/url-repository.js";
export type {
  AppError,
  InvalidShortCodeError,
  InvalidUrlError,
  RepositoryError,
  ShortCodeGenerationError,
  UrlNotFoundError,
} from "./domain/errors.js";

export { createInMemoryUrlRepository } from "./infrastructure/repositories/in-memory-url-repository.js";
export { createDynamoDbUrlRepository } from "./infrastructure/repositories/dynamodb-url-repository.js";
export type {
  DynamoDbDocumentSender,
  DynamoDbUrlRepositoryDeps,
} from "./infrastructure/repositories/dynamodb-url-repository.js";
export { createDynamoDbDocumentClient } from "./infrastructure/dynamodb/db.js";
export type { DynamoDbClientConfig } from "./infrastructure/dynamodb/db.js";

export {
  validateCreateShortUrlInput,
  validateShortCode,
} from "./validation/url-schema.js";
export type { CreateShortUrlInput } from "./validation/url-schema.js";

export { err, ok } from "./shared/result.js";
export type { Err, Ok, Result } from "./shared/result.js";

export { fixedClock, systemClock } from "./utils/clock.js";
export type { Clock } from "./utils/clock.js";
export {
  createShortCodeGenerator,
  cryptoShortCodeGenerator,
  DEFAULT_SHORT_CODE_LENGTH,
  URL_SAFE_ALPHABET,
} from "./utils/short-code.js";
export type { RandomInt, ShortCodeGenerator } from "./utils/short-code.js";
