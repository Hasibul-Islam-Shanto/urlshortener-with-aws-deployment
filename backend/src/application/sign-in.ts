import { signAccessToken } from "../auth/jwt.js";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../auth/password.js";
import { invalidCredentialsError } from "../domain/errors.js";
import type {
  InvalidCredentialsError,
  RepositoryError,
  ValidationFailedError,
} from "../domain/errors.js";
import { toPublicUser } from "../domain/user.js";
import type { PublicUser } from "../domain/user.js";
import type { UserRepository } from "../domain/user-repository.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import { validateCredentials } from "../validation/auth-schema.js";

export type SignInResult = {
  readonly accessToken: string;
  readonly user: PublicUser;
};

export type SignInDeps = {
  readonly repository: UserRepository;
  readonly jwtSecret: string;
  readonly verifyPassword?: (password: string, passwordHash: string) => Promise<boolean>;
  readonly signAccessToken?: (userId: string) => Promise<string>;
};

export type SignInError =
  ValidationFailedError | InvalidCredentialsError | RepositoryError;

export type SignIn = (input: unknown) => Promise<Result<SignInResult, SignInError>>;

export const signIn =
  ({
    repository,
    jwtSecret,
    verifyPassword: verify = verifyPassword,
    signAccessToken: sign = (userId) => signAccessToken(userId, jwtSecret),
  }: SignInDeps): SignIn =>
  async (input) => {
    const validated = validateCredentials(input);
    if (!validated.success) {
      return validated;
    }

    const found = await repository.findByEmail(validated.value.email);
    if (!found.success) {
      return found;
    }

    const passwordHash = found.value?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const matches = await verify(validated.value.password, passwordHash);
    if (found.value === null || !matches) {
      return err(invalidCredentialsError());
    }

    return ok({
      accessToken: await sign(found.value.userId),
      user: toPublicUser(found.value),
    });
  };
