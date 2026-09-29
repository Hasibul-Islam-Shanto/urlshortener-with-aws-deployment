import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/urls": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
        "/auth": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      env: {
        VITE_API_BASE_URL: "https://api.example.com",
      },
    },
  };
});
