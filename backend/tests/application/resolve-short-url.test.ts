import { describe, expect, it } from "vitest";

import { resolveShortUrl } from "../../src/application/resolve-short-url.js";
import { aRecord, failingRepository, recordingRepository } from "../helpers/fakes.js";

describe("resolveShortUrl", () => {
  it("returns the original URL for an existing short code", async () => {
    const { repository } = recordingRepository([
      aRecord({ shortCode: "a8Kx92", originalUrl: "https://example.com/some/long/path" }),
    ]);

    const result = await resolveShortUrl({ repository })("a8Kx92");

    expect(result).toEqual({
      success: true,
      value: { originalUrl: "https://example.com/some/long/path" },
    });
  });

  it("returns UrlNotFound for an unknown short code", async () => {
    const { repository } = recordingRepository();

    const result = await resolveShortUrl({ repository })("missing1");

    expect(result).toEqual({
      success: false,
      error: {
        type: "UrlNotFound",
        message: 'No URL found for short code "missing1"',
        shortCode: "missing1",
      },
    });
  });

  it.each(["", "bad code!", undefined])("rejects invalid short code %j", async (code) => {
    const { repository } = recordingRepository();

    const result = await resolveShortUrl({ repository })(code);

    expect(!result.success && result.error.type).toBe("InvalidShortCode");
  });

  it("returns a repository error when the lookup fails", async () => {
    const result = await resolveShortUrl({ repository: failingRepository() })("a8Kx92");

    expect(!result.success && result.error.type).toBe("Repository");
  });
});
