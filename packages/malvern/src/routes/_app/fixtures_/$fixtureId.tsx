import { createFileRoute, redirect } from "@tanstack/react-router";

import { getFixture } from "../../../lib/matches";

export const Route = createFileRoute("/_app/fixtures_/$fixtureId")({
  beforeLoad: async ({ context, params }) => {
    const fixture = await context.queryClient.ensureQueryData({
      queryKey: ["fixture", params.fixtureId],
      queryFn: () => getFixture({ data: { id: params.fixtureId } }),
    });

    throw redirect({
      to: "/teams/$teamId/fixtures/$fixtureId",
      params: { teamId: fixture.teamId, fixtureId: fixture.id },
      replace: true,
    });
  },
});
