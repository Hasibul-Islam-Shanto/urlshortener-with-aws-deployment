import { describe, expect, it } from "vitest";

import { createDynamoDbDocumentClient } from "../../src/infrastructure/dynamodb/db.js";

describe("createDynamoDbDocumentClient", () => {
  it("uses the configured region", async () => {
    const client = createDynamoDbDocumentClient({ region: "ap-southeast-1" });

    expect(await client.config.region()).toBe("ap-southeast-1");
    client.destroy();
  });

  it("creates independent clients", () => {
    const first = createDynamoDbDocumentClient({ region: "ap-southeast-1" });
    const second = createDynamoDbDocumentClient();

    expect(first).not.toBe(second);
    first.destroy();
    second.destroy();
  });
});
