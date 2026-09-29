import { describe, expect, it } from "vitest";

import {
  duplicateShortCodeError,
  invalidShortCodeError,
  invalidUrlError,
  repositoryError,
  shortCodeGenerationError,
  urlNotFoundError,
} from "../../src/domain/errors.js";
import type { AppError } from "../../src/domain/errors.js";
import {
  appErrorToResponse,
  errorResponse,
  jsonResponse,
} from "../../src/lambda/response.js";

describe("jsonResponse", () => {
  it("serialises the body with a JSON content type", () => {
    expect(jsonResponse(200, { a: 1 })).toEqual({
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: '{"a":1}',
    });
  });
});

describe("errorResponse", () => {
  it("omits details when none are given", () => {
    expect(JSON.parse(errorResponse(400, "Bad").body ?? "")).toEqual({ error: "Bad" });
  });
});

describe("appErrorToResponse", () => {
  it.each<[string, AppError, number]>([
    ["InvalidUrl", invalidUrlError(["URL is malformed"]), 400],
    ["InvalidShortCode", invalidShortCodeError(), 400],
    ["UrlNotFound", urlNotFoundError("abc123"), 404],
    ["ShortCodeGeneration", shortCodeGenerationError(5), 409],
    ["duplicate Repository", duplicateShortCodeError("abc123"), 409],
    ["generic Repository", repositoryError(new Error("secret internals")), 500],
  ])("maps %s to %i", (_label, error, status) => {
    const response = appErrorToResponse(error);
    expect(response.statusCode).toBe(status);
    expect(response.body).not.toContain("secret internals");
  });
});
