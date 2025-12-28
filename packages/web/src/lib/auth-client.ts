import {
  ac,
  assistantCoach,
  coach,
  headCoach,
  parent,
  player,
} from "@laxdb/core/auth/auth.permissions";
// import { polarClient } from "@polar-sh/better-auth";
import type { AccessControl } from "better-auth/plugins/access";
import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    // polarClient(),
    organizationClient({
      ac: ac as unknown as AccessControl,
      roles: {
        headCoach,
        coach,
        assistantCoach,
        player,
        parent,
      },
      teams: {
        enabled: true,
      },
    }),
    lastLoginMethodClient(),
    adminClient(),
  ],
});
