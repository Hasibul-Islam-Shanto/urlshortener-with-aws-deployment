import type { APIGatewayProxyEventV2 } from "aws-lambda";

import type { VerifyAccessToken } from "../composition.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import { unauthorized } from "./response.js";
import type { HttpResponse } from "./response.js";

const authorizationHeader = (event: APIGatewayProxyEventV2): string | undefined => {
  const headers = event.headers;
  const value = headers.authorization ?? headers.Authorization;
  return typeof value === "string" ? value : undefined;
};

export const authenticateRequest = async (
  event: APIGatewayProxyEventV2,
  verifyAccessToken: VerifyAccessToken,
): Promise<Result<string, HttpResponse>> => {
  const header = authorizationHeader(event);
  const match = header === undefined ? null : /^Bearer\s+(\S+)$/.exec(header);
  const token = match?.[1];
  if (token === undefined || token.length === 0) {
    return err(unauthorized());
  }
  const verified = await verifyAccessToken(token);
  return verified.success
    ? ok(verified.value)
    : err(unauthorized(verified.error.message));
};
