import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export type DynamoDbClientConfig = {
  readonly region?: string;
};

/**
 * Credentials and (when `region` is omitted) the region are resolved by the
 * AWS SDK default provider chain: env vars, shared config/SSO profile, or the
 * Lambda execution role.
 */
export const createDynamoDbDocumentClient = ({
  region,
}: DynamoDbClientConfig = {}): DynamoDBDocumentClient =>
  DynamoDBDocumentClient.from(new DynamoDBClient(region === undefined ? {} : { region }));
