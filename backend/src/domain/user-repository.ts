import type { Result } from "../shared/result.js";
import type { RepositoryError } from "./errors.js";
import type { UserRecord } from "./user.js";

export type UserRepository = {
  readonly save: (user: UserRecord) => Promise<Result<void, RepositoryError>>;
  readonly findById: (
    userId: string,
  ) => Promise<Result<UserRecord | null, RepositoryError>>;
  readonly findByEmail: (
    email: string,
  ) => Promise<Result<UserRecord | null, RepositoryError>>;
};
