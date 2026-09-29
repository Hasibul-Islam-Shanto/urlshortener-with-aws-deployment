import { createHandler } from "./create-handler.js";
import type { LambdaHandler } from "./create-handler.js";
import { createLambdaDependencies } from "./dependencies.js";

/** Dependencies are built once per Lambda container, at cold start. */
export const handler: LambdaHandler = createHandler(createLambdaDependencies());
