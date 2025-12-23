import { AuthService } from "@laxdb/core/auth";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { authMiddleware } from "@/lib/middleware";

export const getSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(({ context }) => context.session);

export const logout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const session = context.session;
        if (!session) {
          yield* Effect.tryPromise(() =>
            auth.auth.api.signOut({ headers: context.headers }),
          );
        }
      }),
    ),
  );
