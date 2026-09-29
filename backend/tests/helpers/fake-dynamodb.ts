import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import type { DynamoDbDocumentSender } from "../../src/infrastructure/repositories/dynamodb-url-repository.js";

type FakeResponse = Record<string, unknown>;
type Responder = (command: unknown) => FakeResponse | Promise<FakeResponse>;

/** Records every command sent and answers with `respond` (which may throw). */
export const fakeDynamoDbClient = (respond: Responder = () => ({})) => {
  const commands: unknown[] = [];
  const client = {
    send: async (command: unknown) => {
      commands.push(command);
      return respond(command);
    },
  } as unknown as DynamoDbDocumentSender;
  return { client, commands };
};

export const conditionalCheckFailed = (): ConditionalCheckFailedException =>
  new ConditionalCheckFailedException({
    message: "The conditional request failed",
    $metadata: {},
  });

/** A tiny stateful table honouring `attribute_not_exists(shortCode)` on put. */
export const fakeDynamoDbTable = () => {
  const items = new Map<string, Record<string, unknown>>();
  const respond: Responder = (command) => {
    if (command instanceof PutCommand) {
      const item = command.input.Item ?? {};
      const key = String(item.shortCode);
      if (command.input.ConditionExpression !== undefined && items.has(key)) {
        throw conditionalCheckFailed();
      }
      items.set(key, item);
      return {};
    }
    if (command instanceof GetCommand) {
      const key = String(command.input.Key?.shortCode);
      const item = items.get(key);
      return item === undefined ? {} : { Item: item };
    }
    if (command instanceof ScanCommand) {
      return { Items: [...items.values()] };
    }
    if (command instanceof QueryCommand) {
      const raw: unknown = command.input.ExpressionAttributeValues as unknown;
      const values =
        typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
      const userId = values[":userId"];
      const email = values[":email"];
      const matched = [...items.values()].filter((item) =>
        userId !== undefined ? item.userId === userId : item.email === email,
      );
      return { Items: matched };
    }
    if (command instanceof DeleteCommand) {
      const key = String(command.input.Key?.shortCode);
      const item = items.get(key);
      items.delete(key);
      return item === undefined ? {} : { Attributes: item };
    }
    throw new Error("Unsupported command");
  };
  return { ...fakeDynamoDbClient(respond), items };
};
