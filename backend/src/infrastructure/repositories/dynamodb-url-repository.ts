import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

import { duplicateShortCodeError, repositoryError } from "../../domain/errors.js";
import type { RepositoryError } from "../../domain/errors.js";
import type { UrlRecord } from "../../domain/url.js";
import type { UrlRepository } from "../../domain/url-repository.js";
import { err, ok } from "../../shared/result.js";
import type { Result } from "../../shared/result.js";
import { collectAllPages } from "../dynamodb/pages.js";

export type DynamoDbDocumentSender = Pick<DynamoDBDocumentClient, "send">;

export type DynamoDbUrlRepositoryDeps = {
  readonly client: DynamoDbDocumentSender;
  readonly tableName: string;
};

/** GSI used to list one user's URLs without scanning the table. */
export const USER_URLS_INDEX = "UserUrlsIndex";

const urlItemSchema = z.object({
  shortCode: z.string(),
  originalUrl: z.string(),
  createdAt: z.string(),
  userId: z.string().optional(),
});

type UrlItem = z.infer<typeof urlItemSchema>;

const storedFields = ({ shortCode, originalUrl, createdAt, userId }: UrlItem) =>
  userId === undefined
    ? { shortCode, originalUrl, createdAt }
    : { shortCode, originalUrl, createdAt, userId };

const toRecord = (item: UrlItem): UrlRecord => Object.freeze(storedFields(item));

const parseRecord = (item: unknown): Result<UrlRecord, RepositoryError> => {
  const parsed = urlItemSchema.safeParse(item);
  return parsed.success ? ok(toRecord(parsed.data)) : err(repositoryError(parsed.error));
};

const parseRecords = (items: unknown): Result<readonly UrlRecord[], RepositoryError> => {
  const parsed = z.array(urlItemSchema).safeParse(items);
  return parsed.success
    ? ok(parsed.data.map((item) => toRecord(item)))
    : err(repositoryError(parsed.error));
};

const isConditionalCheckFailure = (error: unknown): boolean =>
  error instanceof Error && error.name === "ConditionalCheckFailedException";

export const createDynamoDbUrlRepository = ({
  client,
  tableName,
}: DynamoDbUrlRepositoryDeps): UrlRepository => ({
  save: async (record) => {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: storedFields(record),
          ConditionExpression: "attribute_not_exists(shortCode)",
        }),
      );
      return ok(undefined);
    } catch (error) {
      return err(
        isConditionalCheckFailure(error)
          ? duplicateShortCodeError(record.shortCode, error)
          : repositoryError(error),
      );
    }
  },

  findByShortCode: async (shortCode) => {
    try {
      const { Item } = await client.send(
        new GetCommand({ TableName: tableName, Key: { shortCode } }),
      );
      return Item === undefined ? ok(null) : parseRecord(Item);
    } catch (error) {
      return err(repositoryError(error));
    }
  },

  findByUserId: async (userId) => {
    try {
      const items = await collectAllPages((startKey) =>
        client.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: USER_URLS_INDEX,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: { ":userId": userId },
            ScanIndexForward: false,
            ...(startKey === undefined ? {} : { ExclusiveStartKey: startKey }),
          }),
        ),
      );
      return parseRecords(items);
    } catch (error) {
      return err(repositoryError(error));
    }
  },

  /** Full table scan across all pages; for dev tooling, not the user dashboard. */
  findAll: async () => {
    try {
      const items = await collectAllPages((startKey) =>
        client.send(
          new ScanCommand({
            TableName: tableName,
            ...(startKey === undefined ? {} : { ExclusiveStartKey: startKey }),
          }),
        ),
      );
      return parseRecords(items);
    } catch (error) {
      return err(repositoryError(error));
    }
  },

  deleteByShortCode: async (shortCode) => {
    try {
      const { Attributes } = await client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { shortCode },
          ReturnValues: "ALL_OLD",
        }),
      );
      return ok(Attributes !== undefined);
    } catch (error) {
      return err(repositoryError(error));
    }
  },
});
