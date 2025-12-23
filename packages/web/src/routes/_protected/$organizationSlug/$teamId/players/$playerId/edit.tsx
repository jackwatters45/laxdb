import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageBody, PageContainer } from "@/components/layout/page-content";
import { TeamBreadcrumbSwitcher } from "@/components/nav/team-breadcrumb-switcher";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PlayerHeader } from "./-components/player-header";
import { mockPlayerDetails } from "./-utils";

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: "GET" })
  .inputValidator((data: { playerId: string }) => data)
  .handler(({ data: _data }) => {
    // FIX: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@laxdb/core/player-development/index');
    // return await PlayerDevelopmentAPI.getPlayerProfile(data.playerId, headers);

    return mockPlayerDetails;
  });

export const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/players/$playerId/edit",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const player = await getPlayerDetails({
      data: { playerId: params.playerId },
    });

    return { player };
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <PageBody>
        <PageContainer>
          <div />
        </PageContainer>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();
  const { player } = Route.useLoaderData();

  return (
    <PlayerHeader
      organizationSlug={organizationSlug}
      playerId={player.id}
      teamId={activeTeam.id}
    >
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Teams">
          <Link params={{ organizationSlug }} to="/$organizationSlug">
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <TeamBreadcrumbSwitcher
        activeTeam={activeTeam}
        organizationSlug={organizationSlug}
        teams={teams}
      >
        {({ team }) => (
          <Link
            params={{
              organizationSlug,
              teamId: team.id,
              playerId: player.id,
            }}
            to="/$organizationSlug/$teamId/players/$playerId/edit"
          >
            {team.name}
          </Link>
        )}
      </TeamBreadcrumbSwitcher>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Players">
          <Link
            params={{ organizationSlug, teamId: activeTeam.id }}
            to="/$organizationSlug/$teamId/players"
          >
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title={player.name}>
          <Link
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: player.id,
            }}
            to="/$organizationSlug/$teamId/players/$playerId"
          >
            {player.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Edit">
          <Link
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: player.id,
            }}
            to="/$organizationSlug/$teamId/players/$playerId/edit"
          >
            Edit
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
