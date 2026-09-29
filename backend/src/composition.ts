import { signAccessToken, verifyAccessToken } from "./auth/jwt.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import { createShortUrl } from "./application/create-short-url.js";
import type { CreateShortUrl } from "./application/create-short-url.js";
import { deleteShortUrl } from "./application/delete-short-url.js";
import type { DeleteShortUrl } from "./application/delete-short-url.js";
import { MAX_GENERATION_ATTEMPTS } from "./application/ensure-unique-short-code.js";
import { getCurrentUser } from "./application/get-current-user.js";
import type { GetCurrentUser } from "./application/get-current-user.js";
import { listShortUrls } from "./application/list-short-urls.js";
import type { ListShortUrls } from "./application/list-short-urls.js";
import { resolveShortUrl } from "./application/resolve-short-url.js";
import type { ResolveShortUrl } from "./application/resolve-short-url.js";
import { signIn } from "./application/sign-in.js";
import type { SignIn } from "./application/sign-in.js";
import { signUp } from "./application/sign-up.js";
import type { SignUp } from "./application/sign-up.js";
import type { DynamoDbConfig } from "./config.js";
import type { UnauthenticatedError } from "./domain/errors.js";
import type { UrlRepository } from "./domain/url-repository.js";
import type { UserRepository } from "./domain/user-repository.js";
import { createDynamoDbDocumentClient } from "./infrastructure/dynamodb/db.js";
import { createDynamoDbUrlRepository } from "./infrastructure/repositories/dynamodb-url-repository.js";
import { createInMemoryUrlRepository } from "./infrastructure/repositories/in-memory-url-repository.js";
import type { Result } from "./shared/result.js";
import { systemClock } from "./utils/clock.js";
import type { Clock } from "./utils/clock.js";
import {
  cryptoShortCodeGenerator,
  DEFAULT_SHORT_CODE_LENGTH,
} from "./utils/short-code.js";

export type AppOptions = {
  readonly repository?: UrlRepository;
  readonly generateShortCode?: () => string;
  readonly now?: Clock;
  readonly maxAttempts?: number;
  readonly shortCodeLength?: number;
};

export type App = {
  readonly createShortUrl: CreateShortUrl;
  readonly resolveShortUrl: ResolveShortUrl;
  readonly listShortUrls: ListShortUrls;
  readonly deleteShortUrl: DeleteShortUrl;
};

export type VerifyAccessToken = (
  token: string,
) => Promise<Result<string, UnauthenticatedError>>;

export type AuthApp = {
  readonly signUp: SignUp;
  readonly signIn: SignIn;
  readonly getCurrentUser: GetCurrentUser;
  readonly verifyAccessToken: VerifyAccessToken;
};

export type AuthAppOptions = {
  readonly userRepository: UserRepository;
  readonly jwtSecret: string;
  readonly now?: Clock;
  readonly createUserId?: () => string;
  readonly hashPassword?: (password: string) => Promise<string>;
  readonly verifyPassword?: (password: string, passwordHash: string) => Promise<boolean>;
};

export const createApp = ({
  repository = createInMemoryUrlRepository(),
  shortCodeLength = DEFAULT_SHORT_CODE_LENGTH,
  generateShortCode = () => cryptoShortCodeGenerator(shortCodeLength),
  now = systemClock,
  maxAttempts = MAX_GENERATION_ATTEMPTS,
}: AppOptions = {}): App => ({
  createShortUrl: createShortUrl({ repository, generateShortCode, now, maxAttempts }),
  resolveShortUrl: resolveShortUrl({ repository }),
  listShortUrls: listShortUrls({ repository }),
  deleteShortUrl: deleteShortUrl({ repository }),
});

export const createAuthApp = ({
  userRepository,
  jwtSecret,
  now = systemClock,
  createUserId = () => crypto.randomUUID(),
  hashPassword: hash = hashPassword,
  verifyPassword: verify = verifyPassword,
}: AuthAppOptions): AuthApp => ({
  signUp: signUp({ repository: userRepository, now, createUserId, hashPassword: hash }),
  signIn: signIn({
    repository: userRepository,
    jwtSecret,
    verifyPassword: verify,
    signAccessToken: (userId) => signAccessToken(userId, jwtSecret),
  }),
  getCurrentUser: getCurrentUser({ repository: userRepository }),
  verifyAccessToken: (token) => verifyAccessToken(token, jwtSecret),
});

export const createDynamoDbApp = (
  { tableName, region }: DynamoDbConfig,
  options: Omit<AppOptions, "repository"> = {},
): App =>
  createApp({
    ...options,
    repository: createDynamoDbUrlRepository({
      client: createDynamoDbDocumentClient(region === undefined ? {} : { region }),
      tableName,
    }),
  });
