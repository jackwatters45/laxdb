import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/$organizationSlug/players/$playerId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello &quot;/$organizationSlug/players/$playerId/edit&quot;!</div>;
}
