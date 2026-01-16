import { HttpApi } from "@effect/platform";

// Unified API definition - groups will be added in subsequent tasks
// Following pattern from scratchpad/effect-api-example
export class LaxdbApi extends HttpApi.make("LaxdbApi") {}
