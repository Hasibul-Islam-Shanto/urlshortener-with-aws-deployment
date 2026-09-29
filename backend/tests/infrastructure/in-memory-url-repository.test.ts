import { describe, expect, it } from "vitest";

import { createInMemoryUrlRepository } from "../../src/infrastructure/repositories/in-memory-url-repository.js";
import { aRecord } from "../helpers/fakes.js";

describe("createInMemoryUrlRepository", () => {
  it("finds a record after saving it", async () => {
    const repository = createInMemoryUrlRepository();
    const record = aRecord();

    expect(await repository.save(record)).toEqual({ success: true, value: undefined });
    expect(await repository.findByShortCode(record.shortCode)).toEqual({
      success: true,
      value: record,
    });
  });

  it("returns null for a missing short code", async () => {
    const repository = createInMemoryUrlRepository();

    expect(await repository.findByShortCode("nope")).toEqual({
      success: true,
      value: null,
    });
  });

  it("can be seeded with initial records", async () => {
    const record = aRecord({ shortCode: "seeded" });
    const repository = createInMemoryUrlRepository([record]);

    expect(await repository.findByShortCode("seeded")).toEqual({
      success: true,
      value: record,
    });
  });

  it("lists every stored record", async () => {
    const first = aRecord({ shortCode: "first1" });
    const second = aRecord({ shortCode: "second" });
    const repository = createInMemoryUrlRepository([first]);
    await repository.save(second);

    expect(await repository.findAll()).toEqual({ success: true, value: [first, second] });
  });

  it("deletes a stored record and reports a miss for an unknown code", async () => {
    const record = aRecord({ shortCode: "gone01" });
    const repository = createInMemoryUrlRepository([record]);

    expect(await repository.deleteByShortCode("gone01")).toEqual({
      success: true,
      value: true,
    });
    expect(await repository.findByShortCode("gone01")).toEqual({
      success: true,
      value: null,
    });
    expect(await repository.deleteByShortCode("gone01")).toEqual({
      success: true,
      value: false,
    });
  });

  it("keeps instances isolated from each other", async () => {
    const first = createInMemoryUrlRepository();
    const second = createInMemoryUrlRepository();

    await first.save(aRecord());

    expect(await second.findByShortCode("abc123")).toEqual({
      success: true,
      value: null,
    });
  });

  it("stores a copy so callers cannot mutate stored state", async () => {
    const repository = createInMemoryUrlRepository();
    const record = { ...aRecord() };

    await repository.save(record);
    (record as { originalUrl: string }).originalUrl = "https://evil.example";

    const found = await repository.findByShortCode("abc123");
    expect(found.success && found.value?.originalUrl).toBe("https://example.com");
    expect(found.success && Object.isFrozen(found.value)).toBe(true);
  });
});
