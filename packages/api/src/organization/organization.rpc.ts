import { Rpc, RpcGroup } from '@effect/rpc';
import { OrganizationContract } from '@laxdb/core/organization/organization.contract';
import { OrganizationService } from '@laxdb/core/organization/organization.service';
import { Effect, Layer } from 'effect';

export class OrganizationRpcs extends RpcGroup.make(
  Rpc.make('OrganizationCreate', {
    success: OrganizationContract.create.success,
    error: OrganizationContract.create.error,
    payload: OrganizationContract.create.payload,
  }),
  Rpc.make('OrganizationAcceptInvitation', {
    success: OrganizationContract.acceptInvitation.success,
    error: OrganizationContract.acceptInvitation.error,
    payload: OrganizationContract.acceptInvitation.payload,
  }),
  Rpc.make('OrganizationGetUserContext', {
    success: OrganizationContract.getUserOrganizationContext.success,
    error: OrganizationContract.getUserOrganizationContext.error,
    payload: OrganizationContract.getUserOrganizationContext.payload,
  })
) {}

export const OrganizationHandlers = OrganizationRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* OrganizationService;

    return {
      OrganizationCreate: (payload) =>
        service.createOrganization(payload, new Headers()),
      OrganizationAcceptInvitation: (payload) =>
        service.acceptInvitation(payload, new Headers()),
      OrganizationGetUserContext: () =>
        service.getUserOrganizationContext(new Headers()),
    };
  })
).pipe(Layer.provide(OrganizationService.Default));
