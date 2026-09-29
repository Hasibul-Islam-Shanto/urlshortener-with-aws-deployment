import type { APIGatewayProxyEventV2 } from "aws-lambda";

import type { VerifyAccessToken } from "../composition.js";
import type { UrlRecord } from "../domain/url.js";
import { authenticateRequest } from "./authenticate.js";
import type { LambdaDependencies } from "./dependencies.js";
import { parseJsonBody, readShortCode, toHttpResponse } from "./http.js";
import { jsonResponse, noContent, redirect } from "./response.js";
import type { HttpResponse } from "./response.js";

type RouteHandler = (
  event: APIGatewayProxyEventV2,
  dependencies: LambdaDependencies,
) => Promise<HttpResponse>;

const withUser = async (
  event: APIGatewayProxyEventV2,
  verifyAccessToken: VerifyAccessToken,
  handle: (userId: string) => Promise<HttpResponse>,
): Promise<HttpResponse> => {
  const user = await authenticateRequest(event, verifyAccessToken);
  if (!user.success) {
    return user.error;
  }
  return handle(user.value);
};

const toListItem = ({ shortCode, originalUrl, createdAt }: UrlRecord) => ({
  shortCode,
  originalUrl,
  createdAt,
});

const signUpRoute: RouteHandler = async (event, { signUp }) => {
  const body = parseJsonBody(event);
  if (!body.success) {
    return body.error;
  }
  return toHttpResponse(await signUp(body.value), () =>
    jsonResponse(201, { message: "User created successfully" }),
  );
};

const signInRoute: RouteHandler = async (event, { signIn }) => {
  const body = parseJsonBody(event);
  if (!body.success) {
    return body.error;
  }
  return toHttpResponse(await signIn(body.value), ({ accessToken, user }) =>
    jsonResponse(200, { accessToken, user }),
  );
};

const currentUserRoute: RouteHandler = async (
  event,
  { getCurrentUser, verifyAccessToken },
) =>
  withUser(event, verifyAccessToken, async (userId) =>
    toHttpResponse(await getCurrentUser(userId), (user) => jsonResponse(200, { user })),
  );

const createUrlRoute: RouteHandler = async (
  event,
  { createShortUrl, verifyAccessToken },
) =>
  withUser(event, verifyAccessToken, async (userId) => {
    const body = parseJsonBody(event);
    if (!body.success) {
      return body.error;
    }
    return toHttpResponse(
      await createShortUrl(body.value, userId),
      ({ shortCode, originalUrl }) => jsonResponse(201, { shortCode, originalUrl }),
    );
  });

const resolveUrlRoute: RouteHandler = async (
  event,
  { resolveShortUrl, verifyAccessToken },
) =>
  withUser(event, verifyAccessToken, async (userId) => {
    const shortCode = readShortCode(event);
    if (!shortCode.success) {
      return shortCode.error;
    }
    return toHttpResponse(
      await resolveShortUrl(shortCode.value, userId),
      ({ originalUrl }) => jsonResponse(200, { shortCode: shortCode.value, originalUrl }),
    );
  });

const listUrlsRoute: RouteHandler = async (event, { listShortUrls, verifyAccessToken }) =>
  withUser(event, verifyAccessToken, async (userId) =>
    toHttpResponse(await listShortUrls(userId), (records) =>
      jsonResponse(200, {
        count: records.length,
        items: records.map(toListItem),
      }),
    ),
  );

const redirectUrlRoute: RouteHandler = async (event, { resolveShortUrl }) => {
  const shortCode = readShortCode(event);
  if (!shortCode.success) {
    return shortCode.error;
  }
  return toHttpResponse(await resolveShortUrl(shortCode.value), ({ originalUrl }) =>
    redirect(originalUrl),
  );
};

const deleteUrlRoute: RouteHandler = async (
  event,
  { deleteShortUrl, verifyAccessToken },
) =>
  withUser(event, verifyAccessToken, async (userId) => {
    const shortCode = readShortCode(event);
    if (!shortCode.success) {
      return shortCode.error;
    }
    return toHttpResponse(await deleteShortUrl(shortCode.value, userId), () =>
      noContent(),
    );
  });

export const routes: ReadonlyMap<string, RouteHandler> = new Map([
  ["POST /auth/signup", signUpRoute],
  ["POST /auth/signin", signInRoute],
  ["GET /auth/me", currentUserRoute],
  ["POST /urls", createUrlRoute],
  ["GET /urls", listUrlsRoute],
  ["GET /urls/{shortCode}", resolveUrlRoute],
  ["GET /{shortCode}", redirectUrlRoute],
  ["DELETE /urls/{shortCode}", deleteUrlRoute],
]);
