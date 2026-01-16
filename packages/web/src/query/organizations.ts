import { OrganizationService } from "@laxdb/core/organization/organization.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { authMiddleware } from "@/lib/middleware";

export const getUserOrganizationContext = createServerFn()
  .middleware([authMiddleware])
  .handler(({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const organizationService = yield* OrganizationService;
        return yield* organizationService.getUserOrganizationContext(
          context.headers,
        );
      }),
    ),
  );
