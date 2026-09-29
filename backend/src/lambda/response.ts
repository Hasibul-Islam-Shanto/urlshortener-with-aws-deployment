import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

import type { AppError } from "../domain/errors.js";

export type HttpResponse = APIGatewayProxyStructuredResultV2 & {
  readonly statusCode: number;
};

export type ErrorBody = {
  readonly error: string;
  readonly details?: readonly string[];
};

const SHORT_CODE_CONFLICT = "Could not allocate a unique short code, please retry";

export const jsonResponse = (statusCode: number, body: unknown): HttpResponse => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const noContent = (): HttpResponse => ({
  statusCode: 204,
});

export const redirect = (location: string): HttpResponse => ({
  statusCode: 302,
  headers: { location },
});

export const errorResponse = (
  statusCode: number,
  error: string,
  details?: readonly string[],
): HttpResponse =>
  jsonResponse(statusCode, details === undefined ? { error } : { error, details });

export const badRequest = (error: string): HttpResponse => errorResponse(400, error);

export const notFound = (error: string): HttpResponse => errorResponse(404, error);

export const internalServerError = (): HttpResponse =>
  errorResponse(500, "Internal server error");

export const unauthorized = (message = "Authentication required"): HttpResponse =>
  jsonResponse(401, { message });

export const conflict = (message: string): HttpResponse => jsonResponse(409, { message });

export const appErrorToResponse = (error: AppError): HttpResponse => {
  switch (error.type) {
    case "InvalidUrl":
      return errorResponse(400, error.message, error.issues);
    case "InvalidShortCode":
      return badRequest(error.message);
    case "UrlNotFound":
      return notFound("Short URL not found");
    case "ShortCodeGeneration":
      return errorResponse(409, SHORT_CODE_CONFLICT);
    case "Repository":
      if (error.reason === "DuplicateShortCode") {
        return errorResponse(409, SHORT_CODE_CONFLICT);
      }
      if (error.reason === "DuplicateEmail") {
        return conflict("An account with this email already exists");
      }
      return internalServerError();
    case "ValidationFailed":
      return jsonResponse(400, { message: error.message, errors: error.errors });
    case "EmailAlreadyExists":
      return conflict(error.message);
    case "InvalidCredentials":
    case "Unauthenticated":
      return unauthorized(error.message);
  }
};
