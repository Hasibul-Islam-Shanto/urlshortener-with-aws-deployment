import { describe, expect, it } from "vitest";

import { loadDynamoDbConfig } from "../src/config.js";

describe("loadDynamoDbConfig", () => {
  it("reads the table name and region", () => {
    expect(
      loadDynamoDbConfig({
        DYNAMODB_TABLE_NAME: "url-shortener",
        AWS_REGION: "ap-southeast-1",
      }),
    ).toEqual({ tableName: "url-shortener", region: "ap-southeast-1" });
  });

  it("leaves the region to the SDK when AWS_REGION is not set", () => {
    const config = loadDynamoDbConfig({ DYNAMODB_TABLE_NAME: "url-shortener" });
    expect(config).toEqual({ tableName: "url-shortener" });
    expect(config).not.toHaveProperty("region");
  });

  it("throws when the table name is missing", () => {
    expect(() => loadDynamoDbConfig({})).toThrow(/DYNAMODB_TABLE_NAME is required/);
  });

  it("throws when the table name is blank", () => {
    expect(() => loadDynamoDbConfig({ DYNAMODB_TABLE_NAME: "  " })).toThrow(
      /DYNAMODB_TABLE_NAME must not be empty/,
    );
  });
});
