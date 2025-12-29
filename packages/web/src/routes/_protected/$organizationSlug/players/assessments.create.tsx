import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_protected/$organizationSlug/players/assessments/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>Hello "/_protected/$organizationSlug/players/assesments/create"!</div>
  );
}
