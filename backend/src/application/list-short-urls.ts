import type { RepositoryError } from "../domain/errors.js";
import type { UrlRecord } from "../domain/url.js";
import type { UrlRepository } from "../domain/url-repository.js";
import { ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export type ListShortUrlsDeps = {
  readonly repository: UrlRepository;
};

export type ListShortUrls = (
  userId: string,
) => Promise<Result<readonly UrlRecord[], RepositoryError>>;

const newestFirst = (a: UrlRecord, b: UrlRecord): number =>
  b.createdAt.localeCompare(a.createdAt);

export const listShortUrls =
  ({ repository }: ListShortUrlsDeps): ListShortUrls =>
  async (userId) => {
    const found = await repository.findByUserId(userId);
    return found.success ? ok([...found.value].sort(newestFirst)) : found;
  };
