import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import { AuthService } from "@laxdb/core/auth";
import { AuthContract } from "@laxdb/core/auth/auth.contract";
import { Effect, Layer } from "effect";

export const AuthApi = HttpApi.make("AuthApi").add(
  HttpApiGroup.make("Auth")
    .add(
      HttpApiEndpoint.post("getSession", "/api/auth/session")
        .addSuccess(AuthContract.getSession.success)
        .addError(AuthContract.getSession.error)
        .setPayload(AuthContract.getSession.payload),
    )
    .add(
      HttpApiEndpoint.post(
        "getActiveOrganization",
        "/api/auth/active-organization",
      )
        .addSuccess(AuthContract.getActiveOrganization.success)
        .addError(AuthContract.getActiveOrganization.error)
        .setPayload(AuthContract.getActiveOrganization.payload),
    ),
);

const AuthApiHandlers = HttpApiBuilder.group(AuthApi, "Auth", (handlers) =>
  Effect.gen(function* () {
    const service = yield* AuthService;

    return handlers
      .handle("getSession", () => service.getSession(new Headers()))
      .handle("getActiveOrganization", () =>
        service.getActiveOrganization(new Headers()),
      );
  }),
).pipe(Layer.provide(AuthService.Default));

export const AuthApiLive = HttpApiBuilder.api(AuthApi).pipe(
  Layer.provide(AuthApiHandlers),
);
