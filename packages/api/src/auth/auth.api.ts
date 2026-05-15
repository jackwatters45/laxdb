import { Me } from "@laxdb/core/auth/auth.schema";
import { AuthenticationError, AuthorizationError } from "@laxdb/core/error";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

import { EmptyPayload } from "../shared/payload";

const AuthErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
] as const;

const me = HttpApiEndpoint.post("me", "/api/me", {
  success: Me,
  error: AuthErrors,
  payload: EmptyPayload,
});

export const AuthGroup = HttpApiGroup.make("Auth").add(me);
