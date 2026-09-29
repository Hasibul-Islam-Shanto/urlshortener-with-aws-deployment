import { hashPassword } from "../auth/password.js";
import { emailAlreadyExistsError } from "../domain/errors.js";
import type {
  EmailAlreadyExistsError,
  RepositoryError,
  ValidationFailedError,
} from "../domain/errors.js";
import { toPublicUser } from "../domain/user.js";
import type { PublicUser, UserRecord } from "../domain/user.js";
import type { UserRepository } from "../domain/user-repository.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import type { Clock } from "../utils/clock.js";
import { validateCredentials } from "../validation/auth-schema.js";

export type SignUpDeps = {
  readonly repository: UserRepository;
  readonly now: Clock;
  readonly createUserId: () => string;
  readonly hashPassword?: (password: string) => Promise<string>;
};

export type SignUpError =
  ValidationFailedError | EmailAlreadyExistsError | RepositoryError;

export type SignUp = (input: unknown) => Promise<Result<PublicUser, SignUpError>>;

export const signUp =
  ({
    repository,
    now,
    createUserId,
    hashPassword: hash = hashPassword,
  }: SignUpDeps): SignUp =>
  async (input) => {
    const validated = validateCredentials(input);
    if (!validated.success) {
      return validated;
    }

    const existing = await repository.findByEmail(validated.value.email);
    if (!existing.success) {
      return existing;
    }
    if (existing.value !== null) {
      return err(emailAlreadyExistsError());
    }

    const timestamp = now().toISOString();
    const user: UserRecord = {
      userId: createUserId(),
      email: validated.value.email,
      passwordHash: await hash(validated.value.password),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const saved = await repository.save(user);
    if (!saved.success) {
      return saved.error.reason === "DuplicateEmail"
        ? err(emailAlreadyExistsError())
        : saved;
    }
    return ok(toPublicUser(user));
  };
