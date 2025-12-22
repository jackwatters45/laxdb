import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/$playerId'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>Hello "/_protected/$organizationSlug/$teamId/players/$playerId"!</div>
  );
}
