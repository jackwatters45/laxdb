import { Context, Layer, type Effect } from "effect";
import { HttpApiClient } from "effect/unstable/httpapi";

import { LaxdbApiV2 } from "./definition";

/**
 * Generated HTTP client for the LaxDB API.
 *
 * The shape is derived directly from `LaxdbApiV2`, so consumers call
 * `client.Drills.listDrills()` / `client.Practices.updatePractice(...)` and
 * get the same schema-checked request and response types as the server.
 */
const makeGeneratedClient = (baseUrl: string) =>
  HttpApiClient.make(LaxdbApiV2, { baseUrl });

type GeneratedApiClient = Effect.Success<
  ReturnType<typeof makeGeneratedClient>
>;

export class ApiClient extends Context.Service<ApiClient, GeneratedApiClient>()(
  "ApiClient",
) {}

/** Every generated HTTP client layer must declare its target base URL. */
export const makeApiClientLayer = (baseUrl: string) =>
  Layer.effect(ApiClient, makeGeneratedClient(baseUrl));
