import { createApp, createDynamoDbApp } from "./composition.js";
import { loadDynamoDbConfig } from "./config.js";

const useDynamoDb = process.argv.includes("--dynamodb");
const app = useDynamoDb ? createDynamoDbApp(loadDynamoDbConfig()) : createApp();

console.log(`repository: ${useDynamoDb ? "dynamodb" : "in-memory"}`);

const created = await app.createShortUrl(
  { url: "https://example.com/some/long/path" },
  "demo-user",
);
console.log("create:", created);

if (created.success) {
  console.log("resolve:", await app.resolveShortUrl(created.value.shortCode));
}

console.log(
  "invalid:",
  await app.createShortUrl({ url: "ftp://example.com" }, "demo-user"),
);
console.log("missing:", await app.resolveShortUrl("doesNotExist"));
