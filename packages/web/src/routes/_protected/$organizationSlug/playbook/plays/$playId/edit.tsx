import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/plays/$playId/edit'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$organizationSlug/playbook/plays/$playId/edit"!</div>;
}
