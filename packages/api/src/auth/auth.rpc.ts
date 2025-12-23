import { Rpc, RpcGroup } from "@effect/rpc";
import { AuthService } from "@laxdb/core/auth";
import { AuthContract } from "@laxdb/core/auth/auth.contract";
import { Effect, Layer } from "effect";

export class AuthRpcs extends RpcGroup.make(
  Rpc.make("AuthGetSession", {
    success: AuthContract.getSession.success,
    error: AuthContract.getSession.error,
    payload: AuthContract.getSession.payload,
  }),
  Rpc.make("AuthGetActiveOrganization", {
    success: AuthContract.getActiveOrganization.success,
    error: AuthContract.getActiveOrganization.error,
    payload: AuthContract.getActiveOrganization.payload,
  }),
) {}

export const AuthHandlers = AuthRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* AuthService;

    return {
      AuthGetSession: () => service.getSession(new Headers()),
      AuthGetActiveOrganization: () =>
        service.getActiveOrganization(new Headers()),
    };
  }),
).pipe(Layer.provide(AuthService.Default));
