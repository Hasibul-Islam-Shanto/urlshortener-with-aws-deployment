/**
 * Local helper for exercising the Lambda handler against the real DynamoDB table.
 *
 *   npm run local:create -- https://example.com/some/path
 *   npm run local:get -- <shortCode>
 *   npm run local:delete -- <shortCode>
 *   npm run local:list
 *
 * Reads AWS_REGION, DYNAMODB_TABLE_NAME, USERS_TABLE_NAME, JWT_SECRET, and
 * FRONTEND_URL from .env. Protected commands also need LOCAL_ACCESS_TOKEN
 * (a JWT from POST /auth/signin). Credentials come from the AWS SDK default
 * provider chain (AWS CLI profile, SSO, env vars).
 */
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { loadDynamoDbConfig } from "../src/config.js";
import { createDynamoDbDocumentClient } from "../src/infrastructure/dynamodb/db.js";
import { collectAllPages } from "../src/infrastructure/dynamodb/pages.js";
import type { HttpResponse } from "../src/lambda/response.js";

const USAGE = `Usage:
  npm run local:create -- <url>
  npm run local:get -- <shortCode>
  npm run local:delete -- <shortCode>
  npm run local:list`;

const apiEvent = (
  routeKey: string,
  extra: Partial<APIGatewayProxyEventV2> = {},
): APIGatewayProxyEventV2 =>
  ({
    version: "2.0",
    routeKey,
    rawPath: routeKey.split(" ")[1] ?? "/",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
      ...(process.env.LOCAL_ACCESS_TOKEN === undefined ||
      process.env.LOCAL_ACCESS_TOKEN === ""
        ? {}
        : { authorization: `Bearer ${process.env.LOCAL_ACCESS_TOKEN}` }),
    },
    isBase64Encoded: false,
    requestContext: { http: { method: routeKey.split(" ")[0] ?? "GET" } },
    ...extra,
  }) as APIGatewayProxyEventV2;

const formatBody = (body: string | undefined): string => {
  try {
    return JSON.stringify(JSON.parse(body ?? "null"), null, 2);
  } catch {
    return body ?? "";
  }
};

const printResponse = (label: string, response: HttpResponse): number => {
  console.log(`${label} -> ${String(response.statusCode)}`);
  console.log(formatBody(response.body));
  return response.statusCode >= 400 ? 1 : 0;
};

const invokeHandler = async (event: APIGatewayProxyEventV2): Promise<HttpResponse> => {
  const { handler } = await import("../src/lambda/handler.js");
  return handler(event);
};

const create = async (url: string): Promise<number> =>
  printResponse(
    "POST /urls",
    await invokeHandler(apiEvent("POST /urls", { body: JSON.stringify({ url }) })),
  );

const get = async (shortCode: string): Promise<number> =>
  printResponse(
    `GET /urls/${shortCode}`,
    await invokeHandler(
      apiEvent("GET /urls/{shortCode}", { pathParameters: { shortCode } }),
    ),
  );

const withTable = async <T>(
  run: (client: DynamoDBDocumentClient, tableName: string) => Promise<T>,
): Promise<T> => {
  const { tableName, region } = loadDynamoDbConfig();
  const client = createDynamoDbDocumentClient(region === undefined ? {} : { region });
  try {
    return await run(client, tableName);
  } finally {
    client.destroy();
  }
};

const remove = async (shortCode: string): Promise<number> =>
  printResponse(
    `DELETE /urls/${shortCode}`,
    await invokeHandler(
      apiEvent("DELETE /urls/{shortCode}", { pathParameters: { shortCode } }),
    ),
  );

const scanAll = (client: DynamoDBDocumentClient, tableName: string) =>
  collectAllPages((startKey) =>
    client.send(
      new ScanCommand({
        TableName: tableName,
        ...(startKey === undefined ? {} : { ExclusiveStartKey: startKey }),
      }),
    ),
  );

const stringField = (item: unknown, key: string): string => {
  if (typeof item !== "object" || item === null || !(key in item)) {
    return "";
  }
  const value = item[key as keyof typeof item];
  return typeof value === "string" ? value : "";
};

const toUrlRow = (item: unknown) => ({
  shortCode: stringField(item, "shortCode"),
  createdAt: stringField(item, "createdAt"),
  originalUrl: stringField(item, "originalUrl"),
});

/** Not an API route: a full table scan, only suitable for small dev tables. */
const list = (): Promise<number> =>
  withTable(async (client, tableName) => {
    const items = (await scanAll(client, tableName))
      .map(toUrlRow)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    console.log(`${String(items.length)} item(s) in ${tableName}`);
    if (items.length > 0) {
      console.table(items);
    }
    return 0;
  });

const commands: ReadonlyMap<string, (arg: string) => Promise<number>> = new Map([
  ["create", create],
  ["get", get],
  ["delete", remove],
  ["list", list],
]);

const COMMANDS_WITHOUT_ARGUMENT: ReadonlySet<string> = new Set(["list"]);

const [commandName = "", arg = ""] = process.argv.slice(2);
const command = commands.get(commandName);

if (
  command === undefined ||
  (arg === "" && !COMMANDS_WITHOUT_ARGUMENT.has(commandName))
) {
  console.error(USAGE);
  process.exitCode = 2;
} else {
  try {
    process.exitCode = await command(arg);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
