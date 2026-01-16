import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/$organizationSlug/games/$gameId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello &quot;/$organizationSlug/games/$gameId/edit&quot;!</div>;
}
