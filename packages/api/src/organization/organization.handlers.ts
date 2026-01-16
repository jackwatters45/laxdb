import { HttpApiBuilder } from "@effect/platform";
import { OrganizationService } from "@laxdb/core/organization/organization.service";
import { Effect, Layer } from "effect";
import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const OrganizationsHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "Organizations",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* OrganizationService;

      return handlers
        .handle("createOrganization", ({ payload }) =>
          service.createOrganization(payload, new Headers()),
        )
        .handle("acceptInvitation", ({ payload }) =>
          service.acceptInvitation(payload, new Headers()),
        )
        .handle("getUserContext", () =>
          service.getUserOrganizationContext(new Headers()),
        );
    }),
).pipe(Layer.provide(OrganizationService.Default));
