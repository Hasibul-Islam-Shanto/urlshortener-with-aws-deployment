export type EnvSource = {
  VITE_API_BASE_URL?: string;
};

export type AppEnv = {
  apiBaseUrl: string;
};

const required = (name: string, value: string | undefined): string => {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const withoutTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const readEnv = (source: EnvSource): AppEnv => ({
  apiBaseUrl: withoutTrailingSlash(
    required("VITE_API_BASE_URL", source.VITE_API_BASE_URL),
  ),
});

export const env = readEnv(import.meta.env);
