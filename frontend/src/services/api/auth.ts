import type { ApiClient } from "./client";
import { ApiError, messageForStatus } from "./errors";

export type AuthUser = {
  userId: string;
  email: string;
};

export type SignInResponse = {
  accessToken: string;
  user: AuthUser;
};

const isUser = (value: unknown): value is AuthUser => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.userId === "string" && typeof record.email === "string";
};

export const parseSignIn = (value: unknown): SignInResponse => {
  if (typeof value !== "object" || value === null) {
    throw new ApiError(500, messageForStatus(500));
  }
  const record = value as Record<string, unknown>;
  if (typeof record.accessToken !== "string" || !isUser(record.user)) {
    throw new ApiError(500, messageForStatus(500));
  }
  return { accessToken: record.accessToken, user: record.user };
};

export const parseCurrentUser = (value: unknown): AuthUser => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("user" in value) ||
    !isUser(value.user)
  ) {
    throw new ApiError(500, messageForStatus(500));
  }
  return value.user;
};

export type AuthApi = {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  me: () => Promise<AuthUser>;
};

export const createAuthApi = (client: ApiClient): AuthApi => ({
  signUp: async (email, password) => {
    await client.request<unknown>("/auth/signup", {
      method: "POST",
      body: { email, password },
    });
  },
  signIn: async (email, password) =>
    parseSignIn(
      await client.request<unknown>("/auth/signin", {
        method: "POST",
        body: { email, password },
      }),
    ),
  me: async () => parseCurrentUser(await client.request<unknown>("/auth/me")),
});
