import { z } from "zod";

export type DynamoDbConfig = {
  readonly tableName: string;
  readonly region?: string;
};

export type LambdaConfig = DynamoDbConfig & {
  readonly usersTableName: string;
  readonly jwtSecret: string;
  readonly frontendUrl: string;
};

const dynamoDbEnvSchema = z.object({
  DYNAMODB_TABLE_NAME: z
    .string({ error: "DYNAMODB_TABLE_NAME is required" })
    .trim()
    .min(1, { error: "DYNAMODB_TABLE_NAME must not be empty" }),
  AWS_REGION: z.string().trim().min(1).optional(),
});

const lambdaEnvSchema = dynamoDbEnvSchema.extend({
  USERS_TABLE_NAME: z
    .string({ error: "USERS_TABLE_NAME is required" })
    .trim()
    .min(1, { error: "USERS_TABLE_NAME must not be empty" }),
  JWT_SECRET: z
    .string({ error: "JWT_SECRET is required" })
    .trim()
    .min(32, { error: "JWT_SECRET must be at least 32 characters" }),
  FRONTEND_URL: z
    .string({ error: "FRONTEND_URL is required" })
    .trim()
    .min(1, { error: "FRONTEND_URL must not be empty" })
    .refine((value) => URL.canParse(value), {
      error: "FRONTEND_URL must be an absolute URL",
    }),
});

const toDynamoDbConfig = ({
  DYNAMODB_TABLE_NAME: tableName,
  AWS_REGION: region,
}: z.infer<typeof dynamoDbEnvSchema>): DynamoDbConfig =>
  region === undefined ? { tableName } : { tableName, region };

const requireConfig = <T>(
  label: string,
  parsed:
    | { success: true; data: T }
    | { success: false; error: { issues: readonly { message: string }[] } },
): T => {
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid ${label} configuration: ${details}`);
  }
  return parsed.data;
};

export const loadDynamoDbConfig = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): DynamoDbConfig =>
  toDynamoDbConfig(requireConfig("DynamoDB", dynamoDbEnvSchema.safeParse(env)));

/** `JWT_SECRET` is read only on the server. */
export const loadLambdaConfig = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): LambdaConfig => {
  const parsed = requireConfig("Lambda", lambdaEnvSchema.safeParse(env));
  const {
    USERS_TABLE_NAME: usersTableName,
    JWT_SECRET: jwtSecret,
    FRONTEND_URL,
  } = parsed;
  return {
    ...toDynamoDbConfig(parsed),
    usersTableName,
    jwtSecret,
    frontendUrl: new URL(FRONTEND_URL).origin,
  };
};
