import type { UrlRecord } from "../../domain/url.js";
import type { UrlRepository } from "../../domain/url-repository.js";
import { ok } from "../../shared/result.js";

const snapshot = (record: UrlRecord): UrlRecord => Object.freeze({ ...record });

export const createInMemoryUrlRepository = (
  initialRecords: readonly UrlRecord[] = [],
): UrlRepository => {
  const store = new Map<string, UrlRecord>(
    initialRecords.map((record) => [record.shortCode, snapshot(record)]),
  );

  return {
    save: (record) => {
      store.set(record.shortCode, snapshot(record));
      return Promise.resolve(ok(undefined));
    },
    findByShortCode: (shortCode) => Promise.resolve(ok(store.get(shortCode) ?? null)),
    findByUserId: (userId) =>
      Promise.resolve(
        ok([...store.values()].filter((record) => record.userId === userId)),
      ),
    findAll: () => Promise.resolve(ok([...store.values()])),
    deleteByShortCode: (shortCode) => Promise.resolve(ok(store.delete(shortCode))),
  };
};
