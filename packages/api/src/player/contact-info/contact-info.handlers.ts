import { HttpApiBuilder } from "@effect/platform";
import { PlayerContactInfoService } from "@laxdb/core/player/contact-info/contact-info.service";
import { Effect, Layer } from "effect";
import { LaxdbApi } from "../../definition";

// Handler implementation using LaxdbApi
export const ContactInfoHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "ContactInfo",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerContactInfoService;

      return handlers.handle("getPlayerWithContactInfo", ({ payload }) =>
        service.getPlayerWithContactInfo(payload),
      );
    }),
).pipe(Layer.provide(PlayerContactInfoService.Default));
