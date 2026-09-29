import { duplicateEmailError } from "../../domain/errors.js";
import type { UserRecord } from "../../domain/user.js";
import type { UserRepository } from "../../domain/user-repository.js";
import { err, ok } from "../../shared/result.js";

const snapshot = (user: UserRecord): UserRecord => Object.freeze({ ...user });

export const createInMemoryUserRepository = (
  initialUsers: readonly UserRecord[] = [],
): UserRepository => {
  const byId = new Map<string, UserRecord>(
    initialUsers.map((user) => [user.userId, snapshot(user)]),
  );

  return {
    save: (user) => {
      const emailTaken = [...byId.values()].some(
        (existing) => existing.email === user.email && existing.userId !== user.userId,
      );
      if (emailTaken || byId.has(user.userId)) {
        return Promise.resolve(err(duplicateEmailError()));
      }
      byId.set(user.userId, snapshot(user));
      return Promise.resolve(ok(undefined));
    },
    findById: (userId) => Promise.resolve(ok(byId.get(userId) ?? null)),
    findByEmail: (email) =>
      Promise.resolve(
        ok([...byId.values()].find((user) => user.email === email) ?? null),
      ),
  };
};
