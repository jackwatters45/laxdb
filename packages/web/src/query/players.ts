import { PlayerService } from "@laxdb/core/player/player.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { OrganizationIdSchema } from "@laxdb/core/schema";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { authMiddleware } from "@/lib/middleware";

const GetOrganizationPlayersSchema = Schema.Struct({
  ...OrganizationIdSchema,
});

export const getOrganizationPlayers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetOrganizationPlayersSchema.Type) =>
    Schema.decodeSync(GetOrganizationPlayersSchema)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.getAll(data);
      }),
    ),
  );
