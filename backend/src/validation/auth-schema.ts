import { z } from "zod";

import { validationFailedError } from "../domain/errors.js";
import type { ValidationFailedError } from "../domain/errors.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt only uses the first 72 bytes. Reject longer passwords instead of truncating. */
export const MAX_PASSWORD_LENGTH = 72;

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .min(1, { error: "Email is required", abort: true })
  .max(254, { error: "Invalid email address" })
  .pipe(z.email({ error: "Invalid email address" }))
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string({ error: "Password is required" })
  .min(MIN_PASSWORD_LENGTH, { error: "Password is too short", abort: true })
  .max(MAX_PASSWORD_LENGTH, { error: "Password is too long" });

export const credentialsSchema = z.object(
  { email: emailField, password: passwordField },
  { error: "Request body must be an object with email and password" },
);

export type Credentials = z.infer<typeof credentialsSchema>;

const fieldErrors = (issues: readonly { path: PropertyKey[]; message: string }[]) => {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    const key = typeof field === "string" ? field : "form";
    errors[key] ??= issue.message;
  }
  return errors;
};

export const validateCredentials = (
  input: unknown,
): Result<Credentials, ValidationFailedError> => {
  const parsed = credentialsSchema.safeParse(input);
  return parsed.success
    ? ok(parsed.data)
    : err(validationFailedError(fieldErrors(parsed.error.issues)));
};
