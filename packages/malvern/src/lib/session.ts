import { ApiClient } from "@laxdb/api/client";
import type { Me } from "@laxdb/core/auth/auth.schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { apiAuth, runApi } from "./api-client";

export type MeCtx = Me | null;

export const getMe = createServerFn({ method: "GET" })
  .middleware([apiAuth])
  .handler(
    ({ context }): Promise<MeCtx> =>
      runApi(
        context.apiCookie,
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Auth.me({ payload: {} });
        }).pipe(
          // Only "not signed in" becomes null (→ login redirect). Transport or
          // authorization failures should surface loudly, not masquerade as a
          // logged-out user.
          Effect.catchTag("AuthenticationError", () => Effect.succeed(null)),
        ),
      ),
  );
