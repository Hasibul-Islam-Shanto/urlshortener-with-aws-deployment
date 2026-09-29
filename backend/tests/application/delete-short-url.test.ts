import { describe, expect, it } from "vitest";

import { deleteShortUrl } from "../../src/application/delete-short-url.js";
import { aRecord, failingRepository, recordingRepository } from "../helpers/fakes.js";

describe("deleteShortUrl", () => {
  it("removes an existing short URL", async () => {
    const { repository } = recordingRepository([
      aRecord({ shortCode: "a8Kx92", userId: "user-1" }),
    ]);

    const result = await deleteShortUrl({ repository })("a8Kx92", "user-1");

    expect(result).toEqual({ success: true, value: undefined });
    expect(await repository.findByShortCode("a8Kx92")).toEqual({
      success: true,
      value: null,
    });
  });

  it("returns UrlNotFound for an unknown short code", async () => {
    const { repository } = recordingRepository();

    const result = await deleteShortUrl({ repository })("missing1", "user-1");

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

    const result = await deleteShortUrl({ repository })(code, "user-1");

    expect(!result.success && result.error.type).toBe("InvalidShortCode");
  });

  it("returns UrlNotFound when the URL belongs to someone else", async () => {
    const { repository } = recordingRepository([
      aRecord({ shortCode: "a8Kx92", userId: "user-2" }),
    ]);

    const result = await deleteShortUrl({ repository })("a8Kx92", "user-1");

    expect(!result.success && result.error.type).toBe("UrlNotFound");
    expect(await repository.findByShortCode("a8Kx92")).toMatchObject({
      success: true,
      value: { shortCode: "a8Kx92" },
    });
  });

  it("returns UrlNotFound for a legacy URL with no owner", async () => {
    const { repository } = recordingRepository([aRecord({ shortCode: "a8Kx92" })]);

    const result = await deleteShortUrl({ repository })("a8Kx92", "user-1");

    expect(!result.success && result.error.type).toBe("UrlNotFound");
  });

  it("returns a repository error when deletion fails", async () => {
    const result = await deleteShortUrl({ repository: failingRepository() })(
      "a8Kx92",
      "user-1",
    );

    expect(!result.success && result.error.type).toBe("Repository");
  });
});
