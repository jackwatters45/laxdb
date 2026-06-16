import { Context, Effect, Layer, Option, Schema } from "effect";

import type { Auth } from "./auth";
import { ActiveMember, AuthSessionResult, type Me } from "./auth.schema";

const decodeSession = Schema.decodeUnknownOption(AuthSessionResult);
const decodeMember = Schema.decodeUnknownOption(ActiveMember);

export class AuthService extends Context.Service<AuthService>()("AuthService", {
  make: Effect.succeed({
    resolveMe: (auth: Auth, headers: Headers) =>
      Effect.gen(function* () {
        const rawSession = yield* Effect.tryPromise(() =>
          auth.api.getSession({ headers }),
        ).pipe(Effect.option);

        if (Option.isNone(rawSession)) return null;

        const parsedSession = decodeSession(rawSession.value);
        if (Option.isNone(parsedSession)) return null;

        const { user, session } = parsedSession.value;

        const rawMember = session.activeOrganizationId
          ? yield* Effect.tryPromise(() =>
              auth.api.getActiveMember({ headers }),
            ).pipe(Effect.option)
          : Option.none();

        const parsedMember = Option.flatMap(rawMember, decodeMember);

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          activeOrganizationId: session.activeOrganizationId ?? null,
          activeMemberId: Option.isSome(parsedMember)
            ? parsedMember.value.id
            : null,
          memberRole: Option.isSome(parsedMember)
            ? parsedMember.value.role
            : null,
        } satisfies Me;
      }),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
