import { describe, expect, it } from "vitest";

import {
  MAX_URL_LENGTH,
  validateCreateShortUrlInput,
  validateShortCode,
} from "../../src/validation/url-schema.js";

describe("validateCreateShortUrlInput", () => {
  it.each([
    "https://example.com",
    "http://example.com/path",
    "https://example.com/path?a=1",
    "https://sub.example.co.uk:8080/a/b#frag",
    "http://localhost:3000",
  ])("accepts %s", (url) => {
    expect(validateCreateShortUrlInput({ url })).toEqual({
      success: true,
      value: { url },
    });
  });

  it("trims surrounding whitespace", () => {
    expect(validateCreateShortUrlInput({ url: "  https://example.com  " })).toEqual({
      success: true,
      value: { url: "https://example.com" },
    });
  });

  it.each([
    ["", "URL must not be empty"],
    ["   ", "URL must not be empty"],
    ["hello", "URL is malformed"],
    ["example.com", "URL is malformed"],
    ["not-a-url", "URL is malformed"],
    ["http://", "URL is malformed"],
    ["https://exa mple.com", "URL is malformed"],
    ["ftp://example.com", "Only http and https URLs are supported"],
    ["javascript:alert(1)", "Only http and https URLs are supported"],
    ["mailto:someone@example.com", "Only http and https URLs are supported"],
    ["file:///etc/passwd", "Only http and https URLs are supported"],
  ])("rejects %j with %s", (url, issue) => {
    expect(validateCreateShortUrlInput({ url })).toEqual({
      success: false,
      error: {
        type: "InvalidUrl",
        message: "The provided URL is invalid",
        issues: [issue],
      },
    });
  });

  it("rejects URLs longer than the maximum length", () => {
    const url = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    const result = validateCreateShortUrlInput({ url });
    expect(result.success).toBe(false);
  });

  it.each([undefined, null, 42, "https://example.com", {}, { url: 123 }, { url: null }])(
    "rejects malformed input %j",
    (input) => {
      const result = validateCreateShortUrlInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("InvalidUrl");
      }
    },
  );
});

describe("validateShortCode", () => {
  it("accepts alphanumeric codes", () => {
    expect(validateShortCode("a8Kx92")).toEqual({ success: true, value: "a8Kx92" });
  });

  it.each(["", "has space", "../etc", "a".repeat(33), 123, undefined])(
    "rejects %j",
    (code) => {
      expect(validateShortCode(code)).toEqual({
        success: false,
        error: {
          type: "InvalidShortCode",
          message: "The provided short code is invalid",
        },
      });
    },
  );
});
