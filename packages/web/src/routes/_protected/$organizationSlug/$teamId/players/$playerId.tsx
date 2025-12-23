import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/players/$playerId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello &quot;/_protected/$organizationSlug/$teamId/players/$playerId&quot;!
    </div>
  );
}
