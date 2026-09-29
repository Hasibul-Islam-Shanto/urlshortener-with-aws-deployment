import { repositoryError } from "../../src/domain/errors.js";
import type { UrlRecord } from "../../src/domain/url.js";
import type { UrlRepository } from "../../src/domain/url-repository.js";
import { err, ok } from "../../src/shared/result.js";
import { fixedClock } from "../../src/utils/clock.js";

export const FIXED_TIMESTAMP = "2026-09-27T16:00:00.000Z";
export const testClock = fixedClock(FIXED_TIMESTAMP);

/** Returns each code in turn, then keeps returning the last one. */
export const sequenceGenerator = (codes: readonly [string, ...string[]]) => {
  const calls: string[] = [];
  const generate = (): string => {
    const code = codes[Math.min(calls.length, codes.length - 1)] ?? codes[0];
    calls.push(code);
    return code;
  };
  return { generate, calls };
};

/** In-memory fake that records every save for assertions. */
export const recordingRepository = (existing: readonly UrlRecord[] = []) => {
  const saved: UrlRecord[] = [];
  const records = new Map(existing.map((record) => [record.shortCode, record]));
  const repository: UrlRepository = {
    save: (record) => {
      saved.push(record);
      records.set(record.shortCode, record);
      return Promise.resolve(ok(undefined));
    },
    findByShortCode: (shortCode) => Promise.resolve(ok(records.get(shortCode) ?? null)),
    findByUserId: (userId) =>
      Promise.resolve(
        ok([...records.values()].filter((record) => record.userId === userId)),
      ),
    findAll: () => Promise.resolve(ok([...records.values()])),
    deleteByShortCode: (shortCode) => Promise.resolve(ok(records.delete(shortCode))),
  };
  return { repository, saved };
};

export const failingRepository = (
  failOn: "save" | "findByShortCode" | "both" = "both",
): UrlRepository => {
  const failure = () =>
    Promise.resolve(err(repositoryError(new Error("connection lost"))));
  return {
    save: failOn === "findByShortCode" ? () => Promise.resolve(ok(undefined)) : failure,
    findByShortCode: failOn === "save" ? () => Promise.resolve(ok(null)) : failure,
    findByUserId: failure,
    findAll: failure,
    deleteByShortCode: failure,
  };
};

export const aRecord = (overrides: Partial<UrlRecord> = {}): UrlRecord => {
  const { userId, ...rest } = overrides;
  return {
    shortCode: "abc123",
    originalUrl: "https://example.com",
    createdAt: FIXED_TIMESTAMP,
    ...rest,
    ...(userId === undefined ? {} : { userId }),
  };
};
