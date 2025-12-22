import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from '@effect/platform';
import { OrganizationContract } from '@laxdb/core/organization/organization.contract';
import { OrganizationService } from '@laxdb/core/organization/organization.service';
import { Effect, Layer } from 'effect';

export const OrganizationsApi = HttpApi.make('OrganizationsApi').add(
  HttpApiGroup.make('Organizations')
    .add(
      HttpApiEndpoint.post('createOrganization', '/api/organizations/create')
        .addSuccess(OrganizationContract.create.success)
        .addError(OrganizationContract.create.error)
        .setPayload(OrganizationContract.create.payload)
    )
    .add(
      HttpApiEndpoint.post(
        'acceptInvitation',
        '/api/organizations/accept-invitation'
      )
        .addSuccess(OrganizationContract.acceptInvitation.success)
        .addError(OrganizationContract.acceptInvitation.error)
        .setPayload(OrganizationContract.acceptInvitation.payload)
    )
    .add(
      HttpApiEndpoint.post('getUserContext', '/api/organizations/user-context')
        .addSuccess(OrganizationContract.getUserOrganizationContext.success)
        .addError(OrganizationContract.getUserOrganizationContext.error)
        .setPayload(OrganizationContract.getUserOrganizationContext.payload)
    )
);

const OrganizationsApiHandlers = HttpApiBuilder.group(
  OrganizationsApi,
  'Organizations',
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* OrganizationService;

      return handlers
        .handle('createOrganization', ({ payload }) =>
          service.createOrganization(payload, new Headers())
        )
        .handle('acceptInvitation', ({ payload }) =>
          service.acceptInvitation(payload, new Headers())
        )
        .handle('getUserContext', () =>
          service.getUserOrganizationContext(new Headers())
        );
    })
).pipe(Layer.provide(OrganizationService.Default));

export const OrganizationsApiLive = HttpApiBuilder.api(OrganizationsApi).pipe(
  Layer.provide(OrganizationsApiHandlers)
);
