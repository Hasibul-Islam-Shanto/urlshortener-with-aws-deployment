import type { CreateShortUrl } from "../application/create-short-url.js";
import type { DeleteShortUrl } from "../application/delete-short-url.js";
import type { GetCurrentUser } from "../application/get-current-user.js";
import type { ListShortUrls } from "../application/list-short-urls.js";
import type { ResolveShortUrl } from "../application/resolve-short-url.js";
import type { SignIn } from "../application/sign-in.js";
import type { SignUp } from "../application/sign-up.js";
import { createApp, createAuthApp } from "../composition.js";
import type { VerifyAccessToken } from "../composition.js";
import { loadLambdaConfig } from "../config.js";
import { createDynamoDbDocumentClient } from "../infrastructure/dynamodb/db.js";
import { createDynamoDbUrlRepository } from "../infrastructure/repositories/dynamodb-url-repository.js";
import { createDynamoDbUserRepository } from "../infrastructure/repositories/dynamodb-user-repository.js";

export type LambdaDependencies = {
  readonly createShortUrl: CreateShortUrl;
  readonly resolveShortUrl: ResolveShortUrl;
  readonly listShortUrls: ListShortUrls;
  readonly deleteShortUrl: DeleteShortUrl;
  readonly signUp: SignUp;
  readonly signIn: SignIn;
  readonly getCurrentUser: GetCurrentUser;
  readonly verifyAccessToken: VerifyAccessToken;
  readonly frontendUrl: string;
};

export const createLambdaDependencies = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): LambdaDependencies => {
  const { tableName, usersTableName, region, jwtSecret, frontendUrl } =
    loadLambdaConfig(env);
  const client = createDynamoDbDocumentClient(region === undefined ? {} : { region });
  return Object.freeze({
    ...createApp({
      repository: createDynamoDbUrlRepository({ client, tableName }),
    }),
    ...createAuthApp({
      userRepository: createDynamoDbUserRepository({ client, tableName: usersTableName }),
      jwtSecret,
    }),
    frontendUrl,
  });
};
