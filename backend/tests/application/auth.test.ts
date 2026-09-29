import { describe, expect, it } from "vitest";

import { verifyPassword } from "../../src/auth/password.js";
import { signUp } from "../../src/application/sign-up.js";
import { signIn } from "../../src/application/sign-in.js";
import { getCurrentUser } from "../../src/application/get-current-user.js";
import { signAccessToken, verifyAccessToken } from "../../src/auth/jwt.js";
import { createInMemoryUserRepository } from "../../src/infrastructure/repositories/in-memory-user-repository.js";
import { hash } from "bcryptjs";
import { testClock } from "../helpers/fakes.js";

const SECRET = "test-secret-that-is-at-least-32-characters";

const hashFast = (password: string) => hash(password, 4);

const users = () => {
  const repository = createInMemoryUserRepository();
  const signUpUser = signUp({
    repository,
    now: testClock,
    createUserId: () => "user-1",
    hashPassword: hashFast,
  });
  const signInUser = signIn({
    repository,
    jwtSecret: SECRET,
    verifyPassword,
  });
  return { repository, signUpUser, signInUser };
};

describe("signUp", () => {
  it("creates a user and stores a bcrypt hash, not the password", async () => {
    const { repository, signUpUser } = users();

    const result = await signUpUser({
      email: " User@Example.com ",
      password: "StrongPassword123!",
    });

    expect(result).toEqual({
      success: true,
      value: { userId: "user-1", email: "user@example.com" },
    });
    const stored = await repository.findByEmail("user@example.com");
    expect(stored.success && stored.value?.passwordHash).not.toBe("StrongPassword123!");
    expect(stored.success && stored.value?.passwordHash.startsWith("$2")).toBe(true);
    expect(
      stored.success &&
        stored.value !== null &&
        (await verifyPassword("StrongPassword123!", stored.value.passwordHash)),
    ).toBe(true);
    expect(result.success && result.value).not.toHaveProperty("passwordHash");
  });

  it("rejects an invalid email", async () => {
    const { signUpUser } = users();
    const result = await signUpUser({
      email: "not-an-email",
      password: "StrongPassword123!",
    });
    expect(result).toMatchObject({
      success: false,
      error: { type: "ValidationFailed", errors: { email: "Invalid email address" } },
    });
  });

  it("rejects a short password", async () => {
    const { signUpUser } = users();
    const result = await signUpUser({ email: "user@example.com", password: "short" });
    expect(result).toMatchObject({
      success: false,
      error: { type: "ValidationFailed", errors: { password: "Password is too short" } },
    });
  });

  it("rejects a duplicate email", async () => {
    const { signUpUser } = users();
    await signUpUser({ email: "user@example.com", password: "StrongPassword123!" });
    const result = await signUpUser({
      email: "USER@example.com",
      password: "AnotherPassword1",
    });
    expect(result).toMatchObject({
      success: false,
      error: { type: "EmailAlreadyExists" },
    });
  });
});

describe("signIn", () => {
  it("returns a JWT for valid credentials", async () => {
    const { signUpUser, signInUser } = users();
    await signUpUser({ email: "user@example.com", password: "StrongPassword123!" });

    const result = await signInUser({
      email: "user@example.com",
      password: "StrongPassword123!",
    });

    expect(result.success && result.value.user).toEqual({
      userId: "user-1",
      email: "user@example.com",
    });
    expect(result.success && result.value).not.toHaveProperty("passwordHash");
    const token = result.success ? result.value.accessToken : "";
    expect(await verifyAccessToken(token, SECRET)).toEqual({
      success: true,
      value: "user-1",
    });
  });

  it("rejects an invalid password without saying whether the email exists", async () => {
    const { signUpUser, signInUser } = users();
    await signUpUser({ email: "user@example.com", password: "StrongPassword123!" });
    const result = await signInUser({
      email: "user@example.com",
      password: "wrong-password",
    });
    expect(result).toMatchObject({
      success: false,
      error: { type: "InvalidCredentials", message: "Invalid email or password" },
    });
  });

  it("rejects an unknown email with the same error", async () => {
    const { signInUser } = users();
    const result = await signInUser({
      email: "missing@example.com",
      password: "StrongPassword123!",
    });
    expect(result).toMatchObject({
      success: false,
      error: { type: "InvalidCredentials", message: "Invalid email or password" },
    });
  });
});

describe("access tokens", () => {
  it("rejects an invalid token", async () => {
    expect(await verifyAccessToken("not-a-jwt", SECRET)).toMatchObject({
      success: false,
    });
  });

  it("rejects an expired token", async () => {
    const token = await signAccessToken(
      "user-1",
      SECRET,
      60,
      Math.floor(Date.now() / 1000) - 120,
    );
    expect(await verifyAccessToken(token, SECRET)).toMatchObject({ success: false });
  });
});

describe("getCurrentUser", () => {
  it("returns the public user and not the password hash", async () => {
    const { repository, signUpUser } = users();
    await signUpUser({ email: "user@example.com", password: "StrongPassword123!" });
    const result = await getCurrentUser({ repository })("user-1");
    expect(result).toEqual({
      success: true,
      value: { userId: "user-1", email: "user@example.com" },
    });
  });

  it("rejects an unknown user id", async () => {
    const repository = createInMemoryUserRepository();
    expect(await getCurrentUser({ repository })("missing")).toMatchObject({
      success: false,
      error: { type: "Unauthenticated" },
    });
  });
});
