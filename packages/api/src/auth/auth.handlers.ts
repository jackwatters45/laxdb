import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";

import { currentSession } from "./auth";

export const AuthHandlers = HttpApiBuilder.group(LaxdbApi, "Auth", (handlers) =>
  Effect.gen(function* () {
    return handlers.handle("me", () => currentSession);
  }),
);
