import { ApiClient } from "@laxdb/api/client";
import type { Me } from "@laxdb/core/auth/auth.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { runApi } from "./api-client";

export type MeCtx = Me | null;

export const getMe = createServerFn({ method: "GET" }).handler(
  (): Promise<MeCtx> =>
    runApi(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Auth.me({ payload: {} });
      }).pipe(
        Effect.catchTag("AuthenticationError", () => Effect.succeed(null)),
        // TODO(auth): decide whether authorization/auth transport failures should
        // also become null once Better Auth integration is finalized.
      ),
    ),
);
