import { afterEach, describe, expect, it, vi } from "vitest";

import { createLambdaDependencies } from "../../src/lambda/dependencies.js";
import { apiEvent, parseBody } from "./fixtures.js";

describe("createLambdaDependencies", () => {
  it("wires DynamoDB-backed use cases from the environment without contacting AWS", () => {
    const dependencies = createLambdaDependencies({
      DYNAMODB_TABLE_NAME: "url-shortener",
      USERS_TABLE_NAME: "url-shortener-users",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters",
      FRONTEND_URL: "http://localhost:5173",
      AWS_REGION: "ap-southeast-1",
    });

    expect(Object.isFrozen(dependencies)).toBe(true);
    expect(typeof dependencies.createShortUrl).toBe("function");
    expect(typeof dependencies.resolveShortUrl).toBe("function");
    expect(typeof dependencies.deleteShortUrl).toBe("function");
    expect(typeof dependencies.signUp).toBe("function");
    expect(typeof dependencies.verifyAccessToken).toBe("function");
  });

  it("fails fast when the table name is not configured", () => {
    expect(() => createLambdaDependencies({})).toThrow(/DYNAMODB_TABLE_NAME/);
  });

  it("fails fast when the JWT secret is not configured", () => {
    expect(() =>
      createLambdaDependencies({
        DYNAMODB_TABLE_NAME: "url-shortener",
        USERS_TABLE_NAME: "url-shortener-users",
        FRONTEND_URL: "http://localhost:5173",
      }),
    ).toThrow(/JWT_SECRET/);
  });
});

describe("lambda handler entry point", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports a handler built from the environment", async () => {
    vi.stubEnv("DYNAMODB_TABLE_NAME", "url-shortener");
    vi.stubEnv("USERS_TABLE_NAME", "url-shortener-users");
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-characters");
    vi.stubEnv("FRONTEND_URL", "http://localhost:5173");
    vi.stubEnv("AWS_REGION", "ap-southeast-1");

    const { handler } = await import("../../src/lambda/handler.js");
    const response = await handler(
      apiEvent({ routeKey: "GET /health", method: "GET", path: "/health" }),
    );

    expect(response.statusCode).toBe(404);
    expect(parseBody(response)).toEqual({ error: "Route not found" });
  });
});
