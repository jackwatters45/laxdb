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

        const activeMember = Option.getOrNull(parsedMember);

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          // Fail closed: an active organization is only trusted when Better Auth
          // confirms the user still has an active membership in it.
          activeOrganizationId:
            activeMember === null
              ? null
              : (session.activeOrganizationId ?? null),
          activeMemberId: activeMember?.id ?? null,
          memberRole: activeMember?.role ?? null,
        } satisfies Me;
      }),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
