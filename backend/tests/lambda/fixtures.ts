import type { APIGatewayProxyEventV2 } from "aws-lambda";

type EventOptions = {
  readonly routeKey: string;
  readonly method: string;
  readonly path: string;
  readonly body?: string;
  readonly isBase64Encoded?: boolean;
  readonly pathParameters?: Record<string, string>;
  readonly headers?: Record<string, string>;
  readonly authenticated?: boolean;
};

export const TEST_TOKEN = "test-token";

export const apiEvent = ({
  routeKey,
  method,
  path,
  body,
  isBase64Encoded = false,
  pathParameters,
  headers = {},
  authenticated = false,
}: EventOptions): APIGatewayProxyEventV2 =>
  ({
    version: "2.0",
    routeKey,
    rawPath: path,
    rawQueryString: "",
    headers: {
      ...(authenticated ? { authorization: `Bearer ${TEST_TOKEN}` } : {}),
      ...headers,
    },
    requestContext: {
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
    },
    isBase64Encoded,
    ...(body === undefined ? {} : { body }),
    ...(pathParameters === undefined ? {} : { pathParameters }),
  }) as APIGatewayProxyEventV2;

export const postUrlsEvent = (
  body?: string,
  isBase64Encoded = false,
): APIGatewayProxyEventV2 =>
  apiEvent({
    routeKey: "POST /urls",
    method: "POST",
    path: "/urls",
    authenticated: true,
    isBase64Encoded,
    ...(body === undefined ? {} : { body }),
  });

export const getUrlEvent = (shortCode?: string): APIGatewayProxyEventV2 =>
  apiEvent({
    routeKey: "GET /urls/{shortCode}",
    method: "GET",
    path: `/urls/${shortCode ?? ""}`,
    authenticated: true,
    ...(shortCode === undefined ? {} : { pathParameters: { shortCode } }),
  });

export const redirectUrlEvent = (shortCode?: string): APIGatewayProxyEventV2 =>
  apiEvent({
    routeKey: "GET /{shortCode}",
    method: "GET",
    path: `/${shortCode ?? ""}`,
    ...(shortCode === undefined ? {} : { pathParameters: { shortCode } }),
  });

export const deleteUrlEvent = (shortCode?: string): APIGatewayProxyEventV2 =>
  apiEvent({
    routeKey: "DELETE /urls/{shortCode}",
    method: "DELETE",
    path: `/urls/${shortCode ?? ""}`,
    authenticated: true,
    ...(shortCode === undefined ? {} : { pathParameters: { shortCode } }),
  });

export const parseBody = (response: { readonly body?: string | undefined }): unknown =>
  JSON.parse(response.body ?? "null");
