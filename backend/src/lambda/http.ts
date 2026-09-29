import type { APIGatewayProxyEventV2 } from "aws-lambda";

import type { AppError } from "../domain/errors.js";
import { err, ok } from "../shared/result.js";
import type { Result } from "../shared/result.js";
import { appErrorToResponse, badRequest } from "./response.js";
import type { HttpResponse } from "./response.js";

const decodeBody = ({ body, isBase64Encoded }: APIGatewayProxyEventV2): string =>
  body === undefined
    ? ""
    : isBase64Encoded
      ? Buffer.from(body, "base64").toString("utf8")
      : body;

export const parseJsonBody = (
  event: APIGatewayProxyEventV2,
): Result<unknown, HttpResponse> => {
  const raw = decodeBody(event);
  if (raw.trim() === "") {
    return err(badRequest("Request body is required"));
  }
  try {
    return ok(JSON.parse(raw) as unknown);
  } catch {
    return err(badRequest("Request body must be valid JSON"));
  }
};

export const readShortCode = (
  event: APIGatewayProxyEventV2,
): Result<string, HttpResponse> => {
  const shortCode = event.pathParameters?.shortCode;
  if (shortCode === undefined || shortCode === "") {
    return err(badRequest("Short code is required"));
  }
  return ok(shortCode);
};

export const toHttpResponse = <T>(
  result: Result<T, AppError>,
  onSuccess: (value: T) => HttpResponse,
): HttpResponse => {
  if (result.success) {
    return onSuccess(result.value);
  }
  const response = appErrorToResponse(result.error);
  if (response.statusCode >= 500) {
    console.error(result.error);
  }
  return response;
};
