import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/$organizationSlug/players/assessments/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello &quot;/_protected/$organizationSlug/players/assesments/create&quot;!</div>;
}
