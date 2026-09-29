import { describe, expect, it } from "vitest";

import { createUrlRecord } from "../../src/domain/url.js";

describe("createUrlRecord", () => {
  const record = createUrlRecord({
    shortCode: "a8Kx92",
    originalUrl: "https://example.com/some/long/path",
    createdAt: new Date("2026-09-27T16:00:00.000Z"),
    userId: "user-1",
  });

  it("builds a record with an ISO timestamp and owner", () => {
    expect(record).toEqual({
      shortCode: "a8Kx92",
      originalUrl: "https://example.com/some/long/path",
      createdAt: "2026-09-27T16:00:00.000Z",
      userId: "user-1",
    });
  });

  it("returns an immutable record", () => {
    expect(Object.isFrozen(record)).toBe(true);
  });
});
