import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { ContactInfoContract } from "@laxdb/core/player/contact-info/contact-info.contract";
import { PlayerContactInfoService } from "@laxdb/core/player/contact-info/contact-info.service";
import { Effect, Layer } from "effect";

export const ContactInfoApi = HttpApi.make("ContactInfoApi").add(
  HttpApiGroup.make("ContactInfo").add(
    HttpApiEndpoint.post("getPlayerWithContactInfo", "/api/contact-info/player")
      .addSuccess(ContactInfoContract.getPlayerWithContactInfo.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(ContactInfoContract.getPlayerWithContactInfo.payload),
  ),
);

const ContactInfoApiHandlers = HttpApiBuilder.group(
  ContactInfoApi,
  "ContactInfo",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* PlayerContactInfoService;

      return handlers.handle("getPlayerWithContactInfo", ({ payload }) =>
        service.getPlayerWithContactInfo(payload),
      );
    }),
).pipe(Layer.provide(PlayerContactInfoService.Default));

export const ContactInfoApiLive = HttpApiBuilder.api(ContactInfoApi).pipe(
  Layer.provide(ContactInfoApiHandlers),
);
