import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import { ApiError, messageForStatus } from "./errors";
import { buildShortUrl, createUrlsApi } from "./urls";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("createUrlsApi", () => {
  it("sends the access token and only the url field", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(201, { shortCode: "a8K2x", originalUrl: "https://example.com" }),
      );
    const api = createUrlsApi(
      createApiClient({
        baseUrl: "https://api.example.com",
        getAccessToken: () => "access-token",
        fetchFn,
      }),
    );

    await expect(api.createUrl("https://example.com")).resolves.toEqual({
      shortCode: "a8K2x",
      originalUrl: "https://example.com",
    });

    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/urls");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-token");
    if (typeof init.body !== "string") {
      throw new Error("Expected a JSON request body");
    }
    expect(JSON.parse(init.body)).toEqual({ url: "https://example.com" });
    expect(JSON.parse(init.body)).not.toHaveProperty("userId");
  });

  it("returns the records from the list response without filtering", async () => {
    const items = [
      {
        shortCode: "a8K2x",
        originalUrl: "https://example.com",
        createdAt: "2026-09-28T12:00:00.000Z",
      },
    ];
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, { count: 1, items }));
    const api = createUrlsApi(
      createApiClient({
        baseUrl: "https://api.example.com",
        getAccessToken: () => "access-token",
        fetchFn,
      }),
    );
    await expect(api.listUrls()).resolves.toEqual(items);
  });

  it("hides raw server error bodies", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "DynamoDB exploded" }), { status: 500 }),
      );
    const api = createUrlsApi(
      createApiClient({
        baseUrl: "https://api.example.com",
        getAccessToken: () => "access-token",
        fetchFn,
      }),
    );
    await expect(api.listUrls()).rejects.toEqual(
      new ApiError(500, messageForStatus(500)),
    );
  });

  it("calls DELETE for a short code", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const api = createUrlsApi(
      createApiClient({
        baseUrl: "https://api.example.com",
        getAccessToken: () => "access-token",
        fetchFn,
      }),
    );
    await api.deleteUrl("a8K2x");
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/urls/a8K2x");
    expect(init.method).toBe("DELETE");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-token");
  });

  it("clears the session on a protected 401, not on sign-in", async () => {
    const onUnauthorized = vi.fn();
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "Authentication required" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "Invalid email or password" }));
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getAccessToken: () => "access-token",
      fetchFn,
      onUnauthorized,
    });
    const api = createUrlsApi(client);
    await expect(api.listUrls()).rejects.toEqual(
      new ApiError(401, messageForStatus(401)),
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();

    onUnauthorized.mockClear();
    await expect(
      client.request("/auth/signin", {
        method: "POST",
        body: { email: "user@example.com", password: "nope" },
      }),
    ).rejects.toEqual(new ApiError(401, messageForStatus(401)));
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe("buildShortUrl", () => {
  it("joins the public base and short code", () => {
    expect(buildShortUrl("https://short.example.com/", "a8K2x")).toBe(
      "https://short.example.com/a8K2x",
    );
  });
});
