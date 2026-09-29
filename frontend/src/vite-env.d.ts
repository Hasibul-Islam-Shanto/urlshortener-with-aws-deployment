/* eslint-disable @typescript-eslint/consistent-type-definitions -- Vite's ImportMeta merges as an interface */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
