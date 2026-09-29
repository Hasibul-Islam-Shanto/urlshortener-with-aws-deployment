import { unauthenticatedError } from "../domain/errors.js";
import type { RepositoryError, UnauthenticatedError } from "../domain/errors.js";
import { toPublicUser } from "../domain/user.js";
import type { PublicUser } from "../domain/user.js";
import type { UserRepository } from "../domain/user-repository.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export type GetCurrentUserDeps = {
  readonly repository: UserRepository;
};

export type GetCurrentUserError = UnauthenticatedError | RepositoryError;

export type GetCurrentUser = (
  userId: string,
) => Promise<Result<PublicUser, GetCurrentUserError>>;

export const getCurrentUser =
  ({ repository }: GetCurrentUserDeps): GetCurrentUser =>
  async (userId) => {
    const found = await repository.findById(userId);
    if (!found.success) {
      return found;
    }
    return found.value === null
      ? err(unauthenticatedError())
      : ok(toPublicUser(found.value));
  };
