import { describe, expect, it } from "vitest";

import { createApp, createDynamoDbApp } from "../src/composition.js";
import { FIXED_TIMESTAMP, testClock } from "./helpers/fakes.js";

describe("createApp", () => {
  it("wires create and resolve against a shared repository", async () => {
    const app = createApp({ now: testClock, generateShortCode: () => "abc123" });

    const created = await app.createShortUrl({ url: "https://example.com" }, "user-1");
    expect(created).toEqual({
      success: true,
      value: {
        shortCode: "abc123",
        originalUrl: "https://example.com",
        createdAt: FIXED_TIMESTAMP,
        userId: "user-1",
      },
    });

    expect(await app.resolveShortUrl("abc123")).toEqual({
      success: true,
      value: { originalUrl: "https://example.com" },
    });
    expect(await app.deleteShortUrl("abc123", "user-1")).toEqual({
      success: true,
      value: undefined,
    });
    expect(await app.resolveShortUrl("abc123")).toMatchObject({
      success: false,
      error: { type: "UrlNotFound" },
    });
  });

  it("builds a DynamoDB-backed app without contacting AWS", () => {
    const app = createDynamoDbApp({
      tableName: "url-shortener",
      region: "ap-southeast-1",
    });

    expect(typeof app.createShortUrl).toBe("function");
    expect(typeof app.resolveShortUrl).toBe("function");
    expect(typeof app.deleteShortUrl).toBe("function");
  });

  it("builds a DynamoDB-backed app when the region is left to the SDK", () => {
    const app = createDynamoDbApp({ tableName: "url-shortener" });

    expect(typeof app.createShortUrl).toBe("function");
  });

  it("uses production defaults with the configured code length", async () => {
    const app = createApp({ shortCodeLength: 9 });

    const created = await app.createShortUrl({ url: "https://example.com" }, "user-1");

    expect(created.success && created.value.shortCode).toMatch(/^[A-Za-z0-9]{9}$/);
  });
});
