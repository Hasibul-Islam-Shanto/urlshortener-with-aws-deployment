import { describe, expect, it } from "vitest";

import { createShortUrl } from "../../src/application/create-short-url.js";
import { MAX_GENERATION_ATTEMPTS } from "../../src/application/ensure-unique-short-code.js";
import {
  aRecord,
  failingRepository,
  FIXED_TIMESTAMP,
  recordingRepository,
  sequenceGenerator,
  testClock,
} from "../helpers/fakes.js";

describe("createShortUrl", () => {
  it("creates a record for a valid URL", async () => {
    const { repository } = recordingRepository();

    const result = await createShortUrl({
      repository,
      generateShortCode: () => "abc123",
      now: testClock,
    })({ url: "https://example.com/some/long/path", userId: "ignored" }, "user-1");

    expect(result).toEqual({
      success: true,
      value: {
        shortCode: "abc123",
        originalUrl: "https://example.com/some/long/path",
        createdAt: FIXED_TIMESTAMP,
        userId: "user-1",
      },
    });
  });

  it("saves exactly the returned record", async () => {
    const { repository, saved } = recordingRepository();

    const result = await createShortUrl({
      repository,
      generateShortCode: () => "abc123",
      now: testClock,
    })({ url: "https://example.com" }, "user-1");

    expect(saved).toEqual([
      {
        shortCode: "abc123",
        originalUrl: "https://example.com",
        createdAt: FIXED_TIMESTAMP,
        userId: "user-1",
      },
    ]);
    expect(result.success && result.value).toEqual(saved[0]);
  });

  it.each([
    ["invalid URL", "not-a-url"],
    ["empty URL", ""],
    ["unsupported protocol", "ftp://example.com"],
  ])("rejects %s without touching the repository", async (_label, url) => {
    const { repository, saved } = recordingRepository();
    const generator = sequenceGenerator(["abc123"]);

    const result = await createShortUrl({
      repository,
      generateShortCode: generator.generate,
      now: testClock,
    })({ url }, "user-1");

    expect(result.success).toBe(false);
    expect(!result.success && result.error.type).toBe("InvalidUrl");
    expect(generator.calls).toEqual([]);
    expect(saved).toEqual([]);
  });

  it("retries on collision and uses the first free code", async () => {
    const { repository, saved } = recordingRepository([
      aRecord({ shortCode: "taken1" }),
      aRecord({ shortCode: "taken2" }),
    ]);
    const generator = sequenceGenerator(["taken1", "taken2", "free99"]);

    const result = await createShortUrl({
      repository,
      generateShortCode: generator.generate,
      now: testClock,
    })({ url: "https://example.com" }, "user-1");

    expect(result.success && result.value.shortCode).toBe("free99");
    expect(generator.calls).toEqual(["taken1", "taken2", "free99"]);
    expect(saved.map((record) => record.shortCode)).toEqual(["free99"]);
  });

  it("fails after the default maximum number of attempts", async () => {
    const { repository, saved } = recordingRepository([aRecord({ shortCode: "taken1" })]);
    const generator = sequenceGenerator(["taken1"]);

    const result = await createShortUrl({
      repository,
      generateShortCode: generator.generate,
      now: testClock,
    })({ url: "https://example.com" }, "user-1");

    expect(result).toEqual({
      success: false,
      error: {
        type: "ShortCodeGeneration",
        message: `Could not generate a unique short code after ${String(MAX_GENERATION_ATTEMPTS)} attempts`,
        attempts: MAX_GENERATION_ATTEMPTS,
      },
    });
    expect(generator.calls).toHaveLength(MAX_GENERATION_ATTEMPTS);
    expect(saved).toEqual([]);
  });

  it("respects a custom maximum number of attempts", async () => {
    const { repository } = recordingRepository([aRecord({ shortCode: "taken1" })]);
    const generator = sequenceGenerator(["taken1"]);

    const result = await createShortUrl({
      repository,
      generateShortCode: generator.generate,
      now: testClock,
      maxAttempts: 2,
    })({ url: "https://example.com" }, "user-1");

    expect(!result.success && result.error.type).toBe("ShortCodeGeneration");
    expect(generator.calls).toHaveLength(2);
  });

  it("returns a repository error when the lookup fails", async () => {
    const result = await createShortUrl({
      repository: failingRepository("findByShortCode"),
      generateShortCode: () => "abc123",
      now: testClock,
    })({ url: "https://example.com" }, "user-1");

    expect(!result.success && result.error.type).toBe("Repository");
  });

  it("returns a repository error when saving fails", async () => {
    const result = await createShortUrl({
      repository: failingRepository("save"),
      generateShortCode: () => "abc123",
      now: testClock,
    })({ url: "https://example.com" }, "user-1");

    expect(!result.success && result.error).toMatchObject({
      type: "Repository",
      message: "A storage error occurred",
    });
  });
});
