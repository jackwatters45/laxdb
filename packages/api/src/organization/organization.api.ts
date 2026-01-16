import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { OrganizationContract } from "@laxdb/core/organization/organization.contract";

// Group definition - no LaxdbApi import
export const OrganizationsGroup = HttpApiGroup.make("Organizations")
  .add(
    HttpApiEndpoint.post("createOrganization", "/api/organizations/create")
      .addSuccess(OrganizationContract.create.success)
      .addError(OrganizationContract.create.error)
      .setPayload(OrganizationContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post(
      "acceptInvitation",
      "/api/organizations/accept-invitation",
    )
      .addSuccess(OrganizationContract.acceptInvitation.success)
      .addError(OrganizationContract.acceptInvitation.error)
      .setPayload(OrganizationContract.acceptInvitation.payload),
  )
  .add(
    HttpApiEndpoint.post("getUserContext", "/api/organizations/user-context")
      .addSuccess(OrganizationContract.getUserOrganizationContext.success)
      .addError(OrganizationContract.getUserOrganizationContext.error)
      .setPayload(OrganizationContract.getUserOrganizationContext.payload),
  );
