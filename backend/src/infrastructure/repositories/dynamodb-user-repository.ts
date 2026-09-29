import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

import { repositoryError } from "../../domain/errors.js";
import type { UserRecord } from "../../domain/user.js";
import type { UserRepository } from "../../domain/user-repository.js";
import { err, ok } from "../../shared/result.js";
import type { DynamoDbDocumentSender } from "./dynamodb-url-repository.js";

/** GSI on the users table. Partition key is the normalized email. */
export const EMAIL_INDEX = "EmailIndex";

export type DynamoDbUserRepositoryDeps = {
  readonly client: DynamoDbDocumentSender;
  readonly tableName: string;
};

const userItemSchema = z.object({
  userId: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const toUser = (item: z.infer<typeof userItemSchema>): UserRecord =>
  Object.freeze({
    userId: item.userId,
    email: item.email,
    passwordHash: item.passwordHash,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });

const readUser = (item: unknown) => {
  const parsed = userItemSchema.safeParse(item);
  return parsed.success ? ok(toUser(parsed.data)) : err(repositoryError(parsed.error));
};

export const createDynamoDbUserRepository = ({
  client,
  tableName,
}: DynamoDbUserRepositoryDeps): UserRepository => ({
  save: async (user) => {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: { ...user },
          ConditionExpression: "attribute_not_exists(userId)",
        }),
      );
      return ok(undefined);
    } catch (error) {
      return err(repositoryError(error));
    }
  },

  findById: async (userId) => {
    try {
      const { Item } = await client.send(
        new GetCommand({ TableName: tableName, Key: { userId } }),
      );
      return Item === undefined ? ok(null) : readUser(Item);
    } catch (error) {
      return err(repositoryError(error));
    }
  },

  findByEmail: async (email) => {
    try {
      const { Items = [] } = await client.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: EMAIL_INDEX,
          KeyConditionExpression: "email = :email",
          ExpressionAttributeValues: { ":email": email },
          Limit: 1,
        }),
      );
      const item = Items[0];
      return item === undefined ? ok(null) : readUser(item);
    } catch (error) {
      return err(repositoryError(error));
    }
  },
});
