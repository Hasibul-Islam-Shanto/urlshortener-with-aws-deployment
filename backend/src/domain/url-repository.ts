import type { Result } from "../shared/result.js";
import type { RepositoryError } from "./errors.js";
import type { UrlRecord } from "./url.js";

export type UrlRepository = {
  readonly save: (record: UrlRecord) => Promise<Result<void, RepositoryError>>;
  readonly findByShortCode: (
    shortCode: string,
  ) => Promise<Result<UrlRecord | null, RepositoryError>>;
  /** URLs owned by `userId`, via the user index. Does not include legacy unowned rows. */
  readonly findByUserId: (
    userId: string,
  ) => Promise<Result<readonly UrlRecord[], RepositoryError>>;
  readonly findAll: () => Promise<Result<readonly UrlRecord[], RepositoryError>>;
  /** `true` when a record was removed, `false` when the short code was absent. */
  readonly deleteByShortCode: (
    shortCode: string,
  ) => Promise<Result<boolean, RepositoryError>>;
};
