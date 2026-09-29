import { z } from "zod";

import { invalidShortCodeError, invalidUrlError } from "../domain/errors.js";
import type { InvalidShortCodeError, InvalidUrlError } from "../domain/errors.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export const MAX_URL_LENGTH = 2048;
export const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

const findUrlProblem = (value: string): string | null => {
  if (!URL.canParse(value)) {
    return "URL is malformed";
  }
  return ALLOWED_PROTOCOLS.has(new URL(value).protocol)
    ? null
    : "Only http and https URLs are supported";
};

export const urlSchema = z
  .string({ error: "URL must be a string" })
  .trim()
  .min(1, { error: "URL must not be empty", abort: true })
  .max(MAX_URL_LENGTH, {
    error: `URL must be at most ${String(MAX_URL_LENGTH)} characters`,
    abort: true,
  })
  .superRefine((value, ctx) => {
    const problem = findUrlProblem(value);
    if (problem !== null) {
      ctx.addIssue({ code: "custom", message: problem });
    }
  });

export const createShortUrlInputSchema = z.object(
  { url: urlSchema },
  { error: "Request body must be an object with a url field" },
);

export type CreateShortUrlInput = z.infer<typeof createShortUrlInputSchema>;

export const shortCodeSchema = z.string().regex(/^[A-Za-z0-9]{1,32}$/);

export const validateCreateShortUrlInput = (
  input: unknown,
): Result<CreateShortUrlInput, InvalidUrlError> => {
  const parsed = createShortUrlInputSchema.safeParse(input);
  return parsed.success
    ? ok(parsed.data)
    : err(invalidUrlError(parsed.error.issues.map((issue) => issue.message)));
};

export const validateShortCode = (
  input: unknown,
): Result<string, InvalidShortCodeError> => {
  const parsed = shortCodeSchema.safeParse(input);
  return parsed.success ? ok(parsed.data) : err(invalidShortCodeError());
};
