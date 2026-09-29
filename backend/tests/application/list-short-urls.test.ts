import { describe, expect, it } from "vitest";

import { listShortUrls } from "../../src/application/list-short-urls.js";
import { aRecord, failingRepository, recordingRepository } from "../helpers/fakes.js";

describe("listShortUrls", () => {
  it("returns all records, newest first", async () => {
    const older = aRecord({
      shortCode: "old111",
      createdAt: "2026-09-01T00:00:00.000Z",
      userId: "user-1",
    });
    const newest = aRecord({
      shortCode: "new333",
      createdAt: "2026-09-03T00:00:00.000Z",
      userId: "user-1",
    });
    const middle = aRecord({
      shortCode: "mid222",
      createdAt: "2026-09-02T00:00:00.000Z",
      userId: "user-1",
    });
    const other = aRecord({ shortCode: "other1", userId: "user-2" });
    const legacy = aRecord({ shortCode: "legacy" });
    const { repository } = recordingRepository([older, newest, middle, other, legacy]);

    expect(await listShortUrls({ repository })("user-1")).toEqual({
      success: true,
      value: [newest, middle, older],
    });
  });

  it("returns an empty list when the user has no records", async () => {
    const { repository } = recordingRepository();

    expect(await listShortUrls({ repository })("user-1")).toEqual({
      success: true,
      value: [],
    });
  });

  it("returns a repository error when listing fails", async () => {
    const result = await listShortUrls({ repository: failingRepository() })("user-1");

    expect(!result.success && result.error.type).toBe("Repository");
  });
});
