import { jwtVerify, SignJWT } from "jose";

import { unauthenticatedError } from "../domain/errors.js";
import type { UnauthenticatedError } from "../domain/errors.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

const secretKey = (secret: string): Uint8Array => new TextEncoder().encode(secret);

export const signAccessToken = (
  userId: string,
  secret: string,
  ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS,
  issuedAtSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(issuedAtSeconds)
    .setExpirationTime(issuedAtSeconds + ttlSeconds)
    .sign(secretKey(secret));

export const verifyAccessToken = async (
  token: string,
  secret: string,
): Promise<Result<string, UnauthenticatedError>> => {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ["HS256"],
    });
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? ok(payload.sub)
      : err(unauthenticatedError());
  } catch {
    return err(unauthenticatedError());
  }
};
