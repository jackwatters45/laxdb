import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_protected/$organizationSlug/players/notes/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_protected/$organizationSlug/players/notes/create"!</div>;
}
