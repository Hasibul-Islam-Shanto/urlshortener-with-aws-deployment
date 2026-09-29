import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import type { CreateShortUrl } from "../../src/application/create-short-url.js";
import type { DeleteShortUrl } from "../../src/application/delete-short-url.js";
import type { ListShortUrls } from "../../src/application/list-short-urls.js";
import type { ResolveShortUrl } from "../../src/application/resolve-short-url.js";
import { createApp } from "../../src/composition.js";
import {
  duplicateShortCodeError,
  invalidShortCodeError,
  invalidUrlError,
  repositoryError,
  shortCodeGenerationError,
  unauthenticatedError,
  urlNotFoundError,
} from "../../src/domain/errors.js";
import { createHandler } from "../../src/lambda/create-handler.js";
import type { LambdaDependencies } from "../../src/lambda/create-handler.js";
import { err, ok } from "../../src/shared/result.js";
import { aRecord, testClock } from "../helpers/fakes.js";
import {
  apiEvent,
  deleteUrlEvent,
  getUrlEvent,
  parseBody,
  postUrlsEvent,
  redirectUrlEvent,
  TEST_TOKEN,
} from "./fixtures.js";

const notCalled = () => Promise.reject(new Error("should not be called"));

const dependencies = (
  overrides: Partial<LambdaDependencies> = {},
): LambdaDependencies => ({
  createShortUrl: notCalled,
  resolveShortUrl: notCalled,
  listShortUrls: notCalled,
  deleteShortUrl: notCalled,
  signUp: notCalled,
  signIn: notCalled,
  getCurrentUser: notCalled,
  verifyAccessToken: (token) =>
    Promise.resolve(token === TEST_TOKEN ? ok("user-1") : err(unauthenticatedError())),
  frontendUrl: "http://localhost:5173",
  ...overrides,
});

const jsonBody = (value: unknown) => JSON.stringify(value);

describe("createHandler", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe("POST /urls", () => {
    it("returns 201 with the created short URL", async () => {
      const createShortUrl = vi.fn<CreateShortUrl>(() =>
        Promise.resolve(ok(aRecord({ shortCode: "abc123" }))),
      );
      const handler = createHandler(dependencies({ createShortUrl }));

      const response = await handler(
        postUrlsEvent(jsonBody({ url: "https://example.com" })),
      );

      expect(response.statusCode).toBe(201);
      expect(response.headers).toMatchObject({ "content-type": "application/json" });
      expect(response.headers?.["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );
      expect(parseBody(response)).toEqual({
        shortCode: "abc123",
        originalUrl: "https://example.com",
      });
      expect(createShortUrl).toHaveBeenCalledWith(
        { url: "https://example.com" },
        "user-1",
      );
    });

    it("decodes base64-encoded bodies", async () => {
      const createShortUrl = vi.fn<CreateShortUrl>(() => Promise.resolve(ok(aRecord())));
      const handler = createHandler(dependencies({ createShortUrl }));
      const encoded = Buffer.from(jsonBody({ url: "https://example.com" })).toString(
        "base64",
      );

      const response = await handler(postUrlsEvent(encoded, true));

      expect(response.statusCode).toBe(201);
      expect(createShortUrl).toHaveBeenCalledWith(
        { url: "https://example.com" },
        "user-1",
      );
    });

    it.each([
      ["missing", undefined],
      ["empty", ""],
      ["blank", "   "],
    ])("returns 400 when the body is %s", async (_label, body) => {
      const handler = createHandler(dependencies());

      const response = await handler(postUrlsEvent(body));

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({ error: "Request body is required" });
    });

    it("returns 400 for malformed JSON", async () => {
      const handler = createHandler(dependencies());

      const response = await handler(postUrlsEvent("{ not json"));

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({ error: "Request body must be valid JSON" });
    });

    it("returns 400 with details for an invalid URL", async () => {
      const createShortUrl = vi.fn<CreateShortUrl>(() =>
        Promise.resolve(err(invalidUrlError(["URL is malformed"]))),
      );
      const handler = createHandler(dependencies({ createShortUrl }));

      const response = await handler(postUrlsEvent(jsonBody({ url: "not-a-url" })));

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({
        error: "The provided URL is invalid",
        details: ["URL is malformed"],
      });
    });

    it.each([
      ["short code generation exhausted", shortCodeGenerationError(5)],
      ["duplicate short code", duplicateShortCodeError("abc123", new Error("aws"))],
    ])("returns 409 when %s", async (_label, error) => {
      const createShortUrl = vi.fn<CreateShortUrl>(() => Promise.resolve(err(error)));
      const handler = createHandler(dependencies({ createShortUrl }));

      const response = await handler(
        postUrlsEvent(jsonBody({ url: "https://example.com" })),
      );

      expect(response.statusCode).toBe(409);
      expect(parseBody(response)).toEqual({
        error: "Could not allocate a unique short code, please retry",
      });
      expect(consoleError).not.toHaveBeenCalled();
    });

    it("returns 500 and logs the error for a repository failure", async () => {
      const failure = repositoryError(
        new Error("AccessDeniedException: arn:aws:iam::123:user/x"),
      );
      const createShortUrl = vi.fn<CreateShortUrl>(() => Promise.resolve(err(failure)));
      const handler = createHandler(dependencies({ createShortUrl }));

      const response = await handler(
        postUrlsEvent(jsonBody({ url: "https://example.com" })),
      );

      expect(response.statusCode).toBe(500);
      expect(parseBody(response)).toEqual({ error: "Internal server error" });
      expect(response.body).not.toContain("arn:aws");
      expect(consoleError).toHaveBeenCalledWith(failure);
    });

    it("returns 500 and logs when the use case throws unexpectedly", async () => {
      const boom = new Error("boom");
      const createShortUrl = vi.fn<CreateShortUrl>(() => Promise.reject(boom));
      const handler = createHandler(dependencies({ createShortUrl }));

      const response = await handler(
        postUrlsEvent(jsonBody({ url: "https://example.com" })),
      );

      expect(response.statusCode).toBe(500);
      expect(parseBody(response)).toEqual({ error: "Internal server error" });
      expect(response.body).not.toContain("boom");
      expect(consoleError).toHaveBeenCalledWith(boom);
    });
  });

  describe("GET /urls/{shortCode}", () => {
    it("returns 200 with the original URL", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(ok({ originalUrl: "https://example.com" })),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(getUrlEvent("abc123"));

      expect(response.statusCode).toBe(200);
      expect(parseBody(response)).toEqual({
        shortCode: "abc123",
        originalUrl: "https://example.com",
      });
      expect(resolveShortUrl).toHaveBeenCalledWith("abc123", "user-1");
    });

    it("returns 400 when the short code is missing", async () => {
      const handler = createHandler(dependencies());

      const response = await handler(getUrlEvent());

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({ error: "Short code is required" });
    });

    it("returns 400 for an invalid short code", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(err(invalidShortCodeError())),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(getUrlEvent("bad!code"));

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({
        error: "The provided short code is invalid",
      });
    });

    it("returns 404 for an unknown short code", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(err(urlNotFoundError("missing1"))),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(getUrlEvent("missing1"));

      expect(response.statusCode).toBe(404);
      expect(parseBody(response)).toEqual({ error: "Short URL not found" });
    });

    it("returns 500 for a repository failure", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(err(repositoryError(new Error("ResourceNotFoundException")))),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(getUrlEvent("abc123"));

      expect(response.statusCode).toBe(500);
      expect(parseBody(response)).toEqual({ error: "Internal server error" });
      expect(consoleError).toHaveBeenCalledOnce();
    });

    it("returns 500 when the use case throws unexpectedly", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.reject(new Error("boom")),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(getUrlEvent("abc123"));

      expect(response.statusCode).toBe(500);
      expect(parseBody(response)).toEqual({ error: "Internal server error" });
    });
  });

  describe("GET /urls", () => {
    const listEvent = () =>
      apiEvent({
        routeKey: "GET /urls",
        method: "GET",
        path: "/urls",
        authenticated: true,
      });

    it("returns 200 with every URL and a count", async () => {
      const records = [
        aRecord({ shortCode: "abc123" }),
        aRecord({ shortCode: "def456" }),
      ];
      const listShortUrls = vi.fn<ListShortUrls>(() => Promise.resolve(ok(records)));
      const handler = createHandler(dependencies({ listShortUrls }));

      const response = await handler(listEvent());

      expect(response.statusCode).toBe(200);
      expect(parseBody(response)).toEqual({ count: 2, items: records });
    });

    it("returns 200 with an empty list", async () => {
      const listShortUrls = vi.fn<ListShortUrls>(() => Promise.resolve(ok([])));
      const handler = createHandler(dependencies({ listShortUrls }));

      const response = await handler(listEvent());

      expect(response.statusCode).toBe(200);
      expect(parseBody(response)).toEqual({ count: 0, items: [] });
    });

    it("returns 500 and logs a repository failure", async () => {
      const failure = repositoryError(new Error("AccessDeniedException: dynamodb:Scan"));
      const listShortUrls = vi.fn<ListShortUrls>(() => Promise.resolve(err(failure)));
      const handler = createHandler(dependencies({ listShortUrls }));

      const response = await handler(listEvent());

      expect(response.statusCode).toBe(500);
      expect(parseBody(response)).toEqual({ error: "Internal server error" });
      expect(consoleError).toHaveBeenCalledWith(failure);
    });
  });

  describe("GET /{shortCode}", () => {
    it("redirects the browser to the original URL", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(ok({ originalUrl: "https://example.com/article" })),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(redirectUrlEvent("HNaiDYx"));

      expect(response.statusCode).toBe(302);
      expect(response.headers).toMatchObject({ location: "https://example.com/article" });
      expect(response.body).toBeUndefined();
      expect(resolveShortUrl).toHaveBeenCalledWith("HNaiDYx");
    });

    it("returns 404 for an unknown short code", async () => {
      const resolveShortUrl = vi.fn<ResolveShortUrl>(() =>
        Promise.resolve(err(urlNotFoundError("missing1"))),
      );
      const handler = createHandler(dependencies({ resolveShortUrl }));

      const response = await handler(redirectUrlEvent("missing1"));

      expect(response.statusCode).toBe(404);
      expect(parseBody(response)).toEqual({ error: "Short URL not found" });
    });
  });

  describe("DELETE /urls/{shortCode}", () => {
    it("returns 204 when the short URL is deleted", async () => {
      const deleteShortUrl = vi.fn<DeleteShortUrl>(() => Promise.resolve(ok(undefined)));
      const handler = createHandler(dependencies({ deleteShortUrl }));

      const response = await handler(deleteUrlEvent("abc123"));

      expect(response.statusCode).toBe(204);
      expect(response.body).toBeUndefined();
      expect(deleteShortUrl).toHaveBeenCalledWith("abc123", "user-1");
    });

    it("returns 400 when the short code is missing", async () => {
      const handler = createHandler(dependencies());

      const response = await handler(deleteUrlEvent());

      expect(response.statusCode).toBe(400);
      expect(parseBody(response)).toEqual({ error: "Short code is required" });
    });

    it("returns 404 for an unknown short code", async () => {
      const deleteShortUrl = vi.fn<DeleteShortUrl>(() =>
        Promise.resolve(err(urlNotFoundError("missing1"))),
      );
      const handler = createHandler(dependencies({ deleteShortUrl }));

      const response = await handler(deleteUrlEvent("missing1"));

      expect(response.statusCode).toBe(404);
      expect(parseBody(response)).toEqual({ error: "Short URL not found" });
    });
  });

  describe("routing", () => {
    it.each([
      ["PUT /urls", "PUT", "/urls"],
      ["POST /other", "POST", "/other"],
      ["$default", "GET", "/anything"],
    ])("returns 404 for unsupported route %s", async (routeKey, method, path) => {
      const handler = createHandler(dependencies());

      const response = await handler(apiEvent({ routeKey, method, path }));

      expect(response.statusCode).toBe(404);
      expect(parseBody(response)).toEqual({ error: "Route not found" });
    });
  });

  describe("with real use cases and the in-memory repository", () => {
    it("creates and then resolves a short URL", async () => {
      const handler = createHandler({
        ...createApp({ now: testClock, generateShortCode: () => "abc123" }),
        signUp: notCalled,
        signIn: notCalled,
        getCurrentUser: notCalled,
        verifyAccessToken: (token) =>
          Promise.resolve(
            token === TEST_TOKEN ? ok("user-1") : err(unauthenticatedError()),
          ),
        frontendUrl: "http://localhost:5173",
      });

      const created = await handler(
        postUrlsEvent(jsonBody({ url: "https://example.com/a" })),
      );
      const resolved = await handler(getUrlEvent("abc123"));
      const followed = await handler(redirectUrlEvent("abc123"));
      const invalid = await handler(
        postUrlsEvent(jsonBody({ url: "ftp://example.com" })),
      );
      const missing = await handler(getUrlEvent("nothere"));
      const deleted = await handler(deleteUrlEvent("abc123"));
      const deletedAgain = await handler(deleteUrlEvent("abc123"));

      expect(created.statusCode).toBe(201);
      expect(parseBody(created)).toEqual({
        shortCode: "abc123",
        originalUrl: "https://example.com/a",
      });
      expect(followed.statusCode).toBe(302);
      expect(followed.headers).toMatchObject({ location: "https://example.com/a" });
      expect(resolved.statusCode).toBe(200);
      expect(parseBody(resolved)).toEqual({
        shortCode: "abc123",
        originalUrl: "https://example.com/a",
      });
      expect(invalid.statusCode).toBe(400);
      expect(missing.statusCode).toBe(404);
      expect(deleted.statusCode).toBe(204);
      expect(deletedAgain.statusCode).toBe(404);
    });
  });
});
