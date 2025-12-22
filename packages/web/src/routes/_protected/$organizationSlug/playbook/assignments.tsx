import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/assignments'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$organizationSlug/playbook/assignments"!</div>;
}
