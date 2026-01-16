import { HttpApiBuilder } from "@effect/platform";
import { AuthService } from "@laxdb/core/auth";
import { Effect, Layer } from "effect";

import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const AuthHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "Auth",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* AuthService;

      return handlers
        .handle("getSession", () => service.getSession(new Headers()))
        .handle("getActiveOrganization", () =>
          service.getActiveOrganization(new Headers()),
        );
    }),
).pipe(Layer.provide(AuthService.Default));
