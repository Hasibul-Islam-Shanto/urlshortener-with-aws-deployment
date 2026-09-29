import { describe, expect, it } from "vitest";

import {
  duplicateShortCodeError,
  repositoryError,
  shortCodeGenerationError,
} from "../../src/domain/errors.js";

describe("error constructors", () => {
  it("repositoryError keeps the cause but uses a generic message", () => {
    const cause = new Error("dynamo timeout at 10.0.0.1");
    const error = repositoryError(cause);
    expect(error).toEqual({
      type: "Repository",
      message: "A storage error occurred",
      cause,
    });
    expect(error.message).not.toContain("10.0.0.1");
  });

  it("repositoryError omits cause when none is given", () => {
    expect(repositoryError()).not.toHaveProperty("cause");
  });

  it("duplicateShortCodeError names the short code and omits a missing cause", () => {
    expect(duplicateShortCodeError("abc123")).toEqual({
      type: "Repository",
      message: 'Short code "abc123" already exists',
      reason: "DuplicateShortCode",
    });
  });

  it("shortCodeGenerationError reports the attempt count", () => {
    expect(shortCodeGenerationError(5)).toEqual({
      type: "ShortCodeGeneration",
      message: "Could not generate a unique short code after 5 attempts",
      attempts: 5,
    });
  });
});
