import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { AuthContract } from "@laxdb/core/auth/auth.contract";

// Group definition - no LaxdbApi import
export const AuthGroup = HttpApiGroup.make("Auth")
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
  );
