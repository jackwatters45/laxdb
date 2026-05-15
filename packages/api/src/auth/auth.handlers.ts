import { AuthService } from "@laxdb/core/auth/auth.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";

import { currentSession } from "./auth";

export const AuthHandlers = HttpApiBuilder.group(LaxdbApi, "Auth", (handlers) =>
  Effect.gen(function* () {
    const authService = yield* AuthService;
    return handlers.handle("me", () => currentSession(authService));
  }),
);
