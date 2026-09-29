import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { describe, expect, it } from "vitest";

import { createShortUrl } from "../../src/application/create-short-url.js";
import { deleteShortUrl } from "../../src/application/delete-short-url.js";
import { resolveShortUrl } from "../../src/application/resolve-short-url.js";
import { createDynamoDbUrlRepository } from "../../src/infrastructure/repositories/dynamodb-url-repository.js";
import {
  conditionalCheckFailed,
  fakeDynamoDbClient,
  fakeDynamoDbTable,
} from "../helpers/fake-dynamodb.js";
import { aRecord, FIXED_TIMESTAMP, testClock } from "../helpers/fakes.js";

const TABLE = "url-shortener-test";

describe("createDynamoDbUrlRepository", () => {
  describe("save", () => {
    it("sends a conditional PutCommand with the record as the item", async () => {
      const { client, commands } = fakeDynamoDbClient();
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });
      const record = aRecord({ shortCode: "a8Kx92" });

      const result = await repository.save(record);

      expect(result).toEqual({ success: true, value: undefined });
      expect(commands).toHaveLength(1);
      expect(commands[0]).toBeInstanceOf(PutCommand);
      expect((commands[0] as PutCommand).input).toEqual({
        TableName: TABLE,
        Item: {
          shortCode: "a8Kx92",
          originalUrl: "https://example.com",
          createdAt: FIXED_TIMESTAMP,
        },
        ConditionExpression: "attribute_not_exists(shortCode)",
      });
    });

    it("translates a conditional-check failure into a duplicate short code error", async () => {
      const failure = conditionalCheckFailed();
      const { client } = fakeDynamoDbClient(() => {
        throw failure;
      });
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.save(aRecord({ shortCode: "taken1" }));

      expect(result).toEqual({
        success: false,
        error: {
          type: "Repository",
          message: 'Short code "taken1" already exists',
          reason: "DuplicateShortCode",
          cause: failure,
        },
      });
    });

    it("translates other DynamoDB errors into a generic repository error", async () => {
      const failure = new Error("ProvisionedThroughputExceededException: arn:aws:...");
      const { client } = fakeDynamoDbClient(() => {
        throw failure;
      });
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.save(aRecord());

      expect(result).toEqual({
        success: false,
        error: {
          type: "Repository",
          message: "A storage error occurred",
          cause: failure,
        },
      });
    });
  });

  describe("findByShortCode", () => {
    it("sends a GetCommand keyed by shortCode on the configured table", async () => {
      const { client, commands } = fakeDynamoDbClient();
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      await repository.findByShortCode("a8Kx92");

      expect(commands).toHaveLength(1);
      expect(commands[0]).toBeInstanceOf(GetCommand);
      expect((commands[0] as GetCommand).input).toEqual({
        TableName: TABLE,
        Key: { shortCode: "a8Kx92" },
      });
    });

    it("returns the stored item as a UrlRecord", async () => {
      const item = aRecord({ shortCode: "a8Kx92" });
      const { client } = fakeDynamoDbClient(() => ({
        Item: { ...item, extra: "ignored" },
      }));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.findByShortCode("a8Kx92");

      expect(result).toEqual({ success: true, value: item });
      expect(result.success && Object.isFrozen(result.value)).toBe(true);
    });

    it("returns null when the item does not exist", async () => {
      const { client } = fakeDynamoDbClient(() => ({}));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.findByShortCode("missing")).toEqual({
        success: true,
        value: null,
      });
    });

    it("returns a repository error for a malformed item", async () => {
      const { client } = fakeDynamoDbClient(() => ({ Item: { shortCode: "a8Kx92" } }));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.findByShortCode("a8Kx92");

      expect(!result.success && result.error).toMatchObject({
        type: "Repository",
        message: "A storage error occurred",
      });
    });

    it("translates DynamoDB errors into a generic repository error", async () => {
      const failure = new Error("ResourceNotFoundException");
      const { client } = fakeDynamoDbClient(() => {
        throw failure;
      });
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.findByShortCode("a8Kx92")).toEqual({
        success: false,
        error: {
          type: "Repository",
          message: "A storage error occurred",
          cause: failure,
        },
      });
    });
  });

  describe("findAll", () => {
    it("scans every page of the configured table", async () => {
      const first = aRecord({ shortCode: "page1a" });
      const second = aRecord({ shortCode: "page2a" });
      const { client, commands } = fakeDynamoDbClient((command) =>
        (command as ScanCommand).input.ExclusiveStartKey === undefined
          ? { Items: [first], LastEvaluatedKey: { shortCode: "page1a" } }
          : { Items: [second] },
      );
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.findAll();

      expect(result).toEqual({ success: true, value: [first, second] });
      expect(commands).toHaveLength(2);
      expect(commands[0]).toBeInstanceOf(ScanCommand);
      expect((commands[0] as ScanCommand).input).toEqual({ TableName: TABLE });
      expect((commands[1] as ScanCommand).input).toEqual({
        TableName: TABLE,
        ExclusiveStartKey: { shortCode: "page1a" },
      });
    });

    it("returns an empty list for an empty table", async () => {
      const { client } = fakeDynamoDbClient(() => ({}));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.findAll()).toEqual({ success: true, value: [] });
    });

    it("returns a repository error if any item is malformed", async () => {
      const { client } = fakeDynamoDbClient(() => ({
        Items: [aRecord(), { shortCode: "broken" }],
      }));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.findAll();

      expect(!result.success && result.error.message).toBe("A storage error occurred");
    });

    it("translates DynamoDB errors into a generic repository error", async () => {
      const failure = new Error("AccessDeniedException: dynamodb:Scan");
      const { client } = fakeDynamoDbClient(() => {
        throw failure;
      });
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.findAll()).toEqual({
        success: false,
        error: {
          type: "Repository",
          message: "A storage error occurred",
          cause: failure,
        },
      });
    });
  });

  describe("deleteByShortCode", () => {
    it("sends a DeleteCommand that returns the previous item", async () => {
      const { client, commands } = fakeDynamoDbClient(() => ({
        Attributes: aRecord({ shortCode: "a8Kx92" }),
      }));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const result = await repository.deleteByShortCode("a8Kx92");

      expect(result).toEqual({ success: true, value: true });
      expect(commands).toHaveLength(1);
      expect(commands[0]).toBeInstanceOf(DeleteCommand);
      expect((commands[0] as DeleteCommand).input).toEqual({
        TableName: TABLE,
        Key: { shortCode: "a8Kx92" },
        ReturnValues: "ALL_OLD",
      });
    });

    it("reports a miss when DynamoDB returns no previous item", async () => {
      const { client } = fakeDynamoDbClient(() => ({}));
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.deleteByShortCode("missing")).toEqual({
        success: true,
        value: false,
      });
    });

    it("translates DynamoDB errors into a generic repository error", async () => {
      const failure = new Error("AccessDeniedException: dynamodb:DeleteItem");
      const { client } = fakeDynamoDbClient(() => {
        throw failure;
      });
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      expect(await repository.deleteByShortCode("a8Kx92")).toEqual({
        success: false,
        error: {
          type: "Repository",
          message: "A storage error occurred",
          cause: failure,
        },
      });
    });
  });

  describe("with the use cases", () => {
    it("creates and resolves a URL through the DynamoDB repository", async () => {
      const { client, items } = fakeDynamoDbTable();
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });

      const created = await createShortUrl({
        repository,
        generateShortCode: () => "abc123",
        now: testClock,
      })({ url: "https://example.com/some/long/path" }, "user-1");

      expect(created).toEqual({
        success: true,
        value: {
          shortCode: "abc123",
          originalUrl: "https://example.com/some/long/path",
          createdAt: FIXED_TIMESTAMP,
          userId: "user-1",
        },
      });
      expect(items.get("abc123")).toEqual(created.success && created.value);

      expect(await resolveShortUrl({ repository })("abc123")).toEqual({
        success: true,
        value: { originalUrl: "https://example.com/some/long/path" },
      });
      expect(await resolveShortUrl({ repository })("nothere")).toMatchObject({
        success: false,
        error: { type: "UrlNotFound" },
      });

      expect(await deleteShortUrl({ repository })("abc123", "user-1")).toEqual({
        success: true,
        value: undefined,
      });
      expect(items.has("abc123")).toBe(false);
      expect(await deleteShortUrl({ repository })("abc123", "user-1")).toMatchObject({
        success: false,
        error: { type: "UrlNotFound" },
      });
    });

    it("does not overwrite an existing item on a direct duplicate save", async () => {
      const { client, items } = fakeDynamoDbTable();
      const repository = createDynamoDbUrlRepository({ client, tableName: TABLE });
      await repository.save(aRecord({ originalUrl: "https://first.example" }));

      const second = await repository.save(
        aRecord({ originalUrl: "https://second.example" }),
      );

      expect(!second.success && second.error.message).toBe(
        'Short code "abc123" already exists',
      );
      expect(items.get("abc123")?.originalUrl).toBe("https://first.example");
    });
  });
});
