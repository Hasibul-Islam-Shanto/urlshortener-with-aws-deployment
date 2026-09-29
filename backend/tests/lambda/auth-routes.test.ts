import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";

import { signAccessToken } from "../../src/auth/jwt.js";
import { createApp, createAuthApp } from "../../src/composition.js";
import { createHandler } from "../../src/lambda/create-handler.js";
import { createInMemoryUserRepository } from "../../src/infrastructure/repositories/in-memory-user-repository.js";
import { testClock } from "../helpers/fakes.js";
import { apiEvent, parseBody, redirectUrlEvent } from "./fixtures.js";

const SECRET = "test-secret-that-is-at-least-32-characters";
const ORIGIN = "http://localhost:5173";

const json = (value: unknown) => JSON.stringify(value);

const app = () => {
  let user = 0;
  let code = 0;
  const handler = createHandler({
    ...createApp({
      now: testClock,
      generateShortCode: () => `code${String(++code)}`,
    }),
    ...createAuthApp({
      userRepository: createInMemoryUserRepository(),
      jwtSecret: SECRET,
      now: testClock,
      createUserId: () => `user-${String(++user)}`,
      hashPassword: (password) => hash(password, 4),
    }),
    frontendUrl: ORIGIN,
  });

  const signUp = (email: string, password: string) =>
    handler(
      apiEvent({
        routeKey: "POST /auth/signup",
        method: "POST",
        path: "/auth/signup",
        body: json({ email, password }),
      }),
    );

  const signIn = async (email: string, password: string) => {
    const response = await handler(
      apiEvent({
        routeKey: "POST /auth/signin",
        method: "POST",
        path: "/auth/signin",
        body: json({ email, password }),
      }),
    );
    const body = parseBody(response) as { accessToken?: string };
    return { response, token: body.accessToken ?? "" };
  };

  const authed = (
    routeKey: string,
    method: string,
    path: string,
    token: string,
    body?: string,
  ) =>
    handler(
      apiEvent({
        routeKey,
        method,
        path,
        authenticated: false,
        headers: { authorization: `Bearer ${token}` },
        ...(body === undefined ? {} : { body }),
        ...(path.startsWith("/urls/") && method !== "POST"
          ? { pathParameters: { shortCode: path.split("/").at(-1) ?? "" } }
          : {}),
      }),
    );

  return { handler, signUp, signIn, authed };
};

describe("authentication routes", () => {
  it("signs up, signs in, and returns the current user", async () => {
    const { signUp, signIn, authed } = app();

    const created = await signUp("user@example.com", "StrongPassword123!");
    expect(created.statusCode).toBe(201);
    expect(parseBody(created)).toEqual({ message: "User created successfully" });
    expect(JSON.stringify(parseBody(created))).not.toContain("passwordHash");

    const { response, token } = await signIn("user@example.com", "StrongPassword123!");
    expect(response.statusCode).toBe(200);
    expect(token.length).toBeGreaterThan(0);

    const me = await authed("GET /auth/me", "GET", "/auth/me", token);
    expect(me.statusCode).toBe(200);
    expect(parseBody(me)).toEqual({
      user: { userId: "user-1", email: "user@example.com" },
    });
  });

  it("rejects duplicate signup and does not reveal unknown emails on sign-in", async () => {
    const { signUp, signIn } = app();
    await signUp("user@example.com", "StrongPassword123!");

    const duplicate = await signUp("user@example.com", "StrongPassword123!");
    expect(duplicate.statusCode).toBe(409);
    expect(parseBody(duplicate)).toEqual({
      message: "An account with this email already exists",
    });

    const unknown = await signIn("missing@example.com", "StrongPassword123!");
    expect(unknown.response.statusCode).toBe(401);
    expect(parseBody(unknown.response)).toEqual({ message: "Invalid email or password" });
  });

  it("rejects missing, invalid, and expired tokens", async () => {
    const { handler } = app();
    const missing = await handler(
      apiEvent({ routeKey: "GET /urls", method: "GET", path: "/urls" }),
    );
    expect(missing.statusCode).toBe(401);

    const invalid = await handler(
      apiEvent({
        routeKey: "GET /urls",
        method: "GET",
        path: "/urls",
        headers: { authorization: "Bearer not-a-jwt" },
      }),
    );
    expect(invalid.statusCode).toBe(401);

    const expired = await signAccessToken(
      "user-1",
      SECRET,
      60,
      Math.floor(Date.now() / 1000) - 120,
    );
    const rejected = await handler(
      apiEvent({
        routeKey: "POST /urls",
        method: "POST",
        path: "/urls",
        headers: { authorization: `Bearer ${expired}` },
        body: json({ url: "https://example.com" }),
      }),
    );
    expect(rejected.statusCode).toBe(401);
  });
});

describe("URL ownership", () => {
  it("scopes create, list, and delete to the authenticated user", async () => {
    const { signUp, signIn, authed, handler } = app();
    await signUp("a@example.com", "StrongPassword123!");
    await signUp("b@example.com", "StrongPassword123!");
    const alice = await signIn("a@example.com", "StrongPassword123!");
    const bob = await signIn("b@example.com", "StrongPassword123!");

    const created = await authed(
      "POST /urls",
      "POST",
      "/urls",
      alice.token,
      json({ url: "https://example.com", userId: "user-2" }),
    );
    expect(created.statusCode).toBe(201);
    expect(parseBody(created)).toEqual({
      shortCode: "code1",
      originalUrl: "https://example.com",
    });

    const aliceList = await authed("GET /urls", "GET", "/urls", alice.token);
    const bobList = await authed("GET /urls", "GET", "/urls", bob.token);
    expect(parseBody(aliceList)).toEqual({
      count: 1,
      items: [
        {
          shortCode: "code1",
          originalUrl: "https://example.com",
          createdAt: "2026-09-27T16:00:00.000Z",
        },
      ],
    });
    expect(parseBody(bobList)).toEqual({ count: 0, items: [] });

    const bobDelete = await authed(
      "DELETE /urls/{shortCode}",
      "DELETE",
      "/urls/code1",
      bob.token,
    );
    expect(bobDelete.statusCode).toBe(404);

    const redirect = await handler(redirectUrlEvent("code1"));
    expect(redirect.statusCode).toBe(302);
    expect(redirect.headers).toMatchObject({ location: "https://example.com" });

    const aliceDelete = await authed(
      "DELETE /urls/{shortCode}",
      "DELETE",
      "/urls/code1",
      alice.token,
    );
    expect(aliceDelete.statusCode).toBe(204);

    const missing = await handler(redirectUrlEvent("missing"));
    expect(missing.statusCode).toBe(404);
  });

  it("answers preflight without a wildcard origin", async () => {
    const { handler } = app();
    const response = await handler(
      apiEvent({ routeKey: "OPTIONS /urls", method: "OPTIONS", path: "/urls" }),
    );
    expect(response.statusCode).toBe(204);
    expect(response.headers?.["access-control-allow-origin"]).toBe(ORIGIN);
    expect(response.headers?.["access-control-allow-origin"]).not.toBe("*");
  });
});
