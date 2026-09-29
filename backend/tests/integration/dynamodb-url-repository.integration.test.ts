import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../../src/composition.js";
import type { App } from "../../src/composition.js";
import { loadDynamoDbConfig } from "../../src/config.js";
import { createUrlRecord } from "../../src/domain/url.js";
import type { UrlRepository } from "../../src/domain/url-repository.js";
import { createDynamoDbDocumentClient } from "../../src/infrastructure/dynamodb/db.js";
import { createDynamoDbUrlRepository } from "../../src/infrastructure/repositories/dynamodb-url-repository.js";
import { cryptoShortCodeGenerator } from "../../src/utils/short-code.js";

const hasTable = Boolean(process.env.DYNAMODB_TABLE_NAME);

describe.skipIf(!hasTable)("DynamoDB repository (real AWS)", () => {
  let tableName: string;
  let client: DynamoDBDocumentClient;
  let repository: UrlRepository;
  let app: App;
  const createdCodes: string[] = [];

  beforeAll(() => {
    const config = loadDynamoDbConfig();
    tableName = config.tableName;
    client = createDynamoDbDocumentClient(
      config.region === undefined ? {} : { region: config.region },
    );
    repository = createDynamoDbUrlRepository({ client, tableName });
    app = createApp({ repository });
  });

  afterAll(async () => {
    await Promise.all(
      createdCodes.map((shortCode) =>
        client.send(new DeleteCommand({ TableName: tableName, Key: { shortCode } })),
      ),
    );
    client.destroy();
  });

  it("creates, stores and resolves a URL", async () => {
    const created = await app.createShortUrl(
      { url: "https://example.com/integration" },
      "user-1",
    );
    expect(created.success).toBe(true);
    if (!created.success) return;
    createdCodes.push(created.value.shortCode);

    expect(await repository.findByShortCode(created.value.shortCode)).toEqual({
      success: true,
      value: created.value,
    });
    expect(await app.resolveShortUrl(created.value.shortCode)).toEqual({
      success: true,
      value: { originalUrl: "https://example.com/integration" },
    });
  });

  it("deletes a stored URL", async () => {
    const created = await app.createShortUrl(
      { url: "https://example.com/delete-me" },
      "user-1",
    );
    expect(created.success).toBe(true);
    if (!created.success) return;
    createdCodes.push(created.value.shortCode);

    expect(await app.deleteShortUrl(created.value.shortCode, "user-1")).toEqual({
      success: true,
      value: undefined,
    });
    expect(await app.resolveShortUrl(created.value.shortCode)).toMatchObject({
      success: false,
      error: { type: "UrlNotFound" },
    });
  });

  it("returns UrlNotFound for a missing short code", async () => {
    const result = await app.resolveShortUrl(`missing${cryptoShortCodeGenerator(12)}`);
    expect(!result.success && result.error.type).toBe("UrlNotFound");
  });

  it("does not overwrite an existing short code", async () => {
    const shortCode = `it${cryptoShortCodeGenerator(12)}`;
    const first = createUrlRecord({
      shortCode,
      originalUrl: "https://first.example",
      createdAt: new Date(),
      userId: "user-1",
    });
    expect((await repository.save(first)).success).toBe(true);
    createdCodes.push(shortCode);

    const second = await repository.save({
      ...first,
      originalUrl: "https://second.example",
    });

    expect(!second.success && second.error.message).toBe(
      `Short code "${shortCode}" already exists`,
    );
    expect(await repository.findByShortCode(shortCode)).toEqual({
      success: true,
      value: first,
    });
  });
});
