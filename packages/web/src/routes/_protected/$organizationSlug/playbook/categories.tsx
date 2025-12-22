import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/categories'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$organizationSlug/playbook/categories"!</div>;
}
