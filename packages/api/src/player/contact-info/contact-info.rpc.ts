import { Rpc, RpcGroup } from "@effect/rpc";
import { ContactInfoContract } from "@laxdb/core/player/contact-info/contact-info.contract";
import { PlayerContactInfoService } from "@laxdb/core/player/contact-info/contact-info.service";
import { Effect, Layer } from "effect";

export class ContactInfoRpcs extends RpcGroup.make(
  Rpc.make("ContactInfoGetPlayerWithContactInfo", {
    success: ContactInfoContract.getPlayerWithContactInfo.success,
    error: ContactInfoContract.getPlayerWithContactInfo.error,
    payload: ContactInfoContract.getPlayerWithContactInfo.payload,
  }),
) {}

export const ContactInfoHandlers = ContactInfoRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerContactInfoService;

    return {
      ContactInfoGetPlayerWithContactInfo: (payload) =>
        service.getPlayerWithContactInfo(payload),
    };
  }),
).pipe(Layer.provide(PlayerContactInfoService.Default));
