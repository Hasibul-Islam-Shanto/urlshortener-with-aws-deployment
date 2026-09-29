import { describe, expect, it } from "vitest";

import { readEnv } from "./env";

describe("readEnv", () => {
  it("reads the API base URL and strips a trailing slash", () => {
    expect(readEnv({ VITE_API_BASE_URL: "https://api.example.com/" })).toEqual({
      apiBaseUrl: "https://api.example.com",
    });
  });

  it("fails startup when the API base URL is missing", () => {
    expect(() => readEnv({ VITE_API_BASE_URL: "  " })).toThrow(/VITE_API_BASE_URL/);
  });
});
