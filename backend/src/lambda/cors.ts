import type { HttpResponse } from "./response.js";

export const corsHeaders = (origin: string): Record<string, string> => ({
  "access-control-allow-origin": origin,
  "access-control-allow-headers": "authorization,content-type",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  vary: "origin",
});

export const applyCors = (response: HttpResponse, origin: string): HttpResponse => ({
  ...response,
  headers: {
    ...corsHeaders(origin),
    ...(response.headers ?? {}),
  },
});
