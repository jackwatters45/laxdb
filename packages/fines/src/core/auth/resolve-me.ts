import { Option, Schema } from "effect";

import type { Auth } from "./auth.ts";
import { ActiveMember, AuthSessionResult, type Me } from "./schema.ts";

const decodeSession = Schema.decodeUnknownOption(AuthSessionResult);
const decodeMember = Schema.decodeUnknownOption(ActiveMember);

export const resolveMe = async (
  auth: Auth,
  headers: Headers,
): Promise<Me | null> => {
  const raw = await auth.api.getSession({ headers });
  const parsed = decodeSession(raw);
  if (Option.isNone(parsed)) return null;
  const { user, session } = parsed.value;

  let memberRole: Me["memberRole"] = null;
  if (session.activeOrganizationId) {
    const rawMember = await auth.api
      .getActiveMember({ headers })
      .catch(() => null);
    const memberParsed = decodeMember(rawMember);
    if (Option.isSome(memberParsed)) memberRole = memberParsed.value.role;
  }

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    activeOrganizationId: session.activeOrganizationId ?? null,
    memberRole,
  };
};
