import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { applyCors } from "./cors.js";
import type { LambdaDependencies } from "./dependencies.js";
import { routes } from "./routes.js";
import { internalServerError, noContent, notFound } from "./response.js";
import type { HttpResponse } from "./response.js";

export type { LambdaDependencies } from "./dependencies.js";

export type LambdaHandler = (event: APIGatewayProxyEventV2) => Promise<HttpResponse>;

export const createHandler =
  (dependencies: LambdaDependencies): LambdaHandler =>
  async (event) => {
    if (event.requestContext.http.method === "OPTIONS") {
      return applyCors(noContent(), dependencies.frontendUrl);
    }
    const route = routes.get(event.routeKey);
    if (route === undefined) {
      return applyCors(notFound("Route not found"), dependencies.frontendUrl);
    }
    try {
      return applyCors(await route(event, dependencies), dependencies.frontendUrl);
    } catch (error) {
      console.error(error);
      return applyCors(internalServerError(), dependencies.frontendUrl);
    }
  };
