import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageBody, PageContainer } from "@/components/layout/page-content";
import { TeamBreadcrumbSwitcher } from "@/components/nav/team-breadcrumb-switcher";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { PlayerHeader } from "./-components/player-header";
import { mockPlayerDetails } from "./-utils";

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: "GET" })
  .inputValidator((data: { playerId: string }) => data)
  .handler(({ data: _data }) => {
    // TODO: Replace with actual API call
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
        <BreadcrumbLink
          className="max-w-full truncate"
          title="Teams"
          render={
            <Link params={{ organizationSlug }} to="/$organizationSlug" />
          }
        >
          Teams
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
        <BreadcrumbLink
          title="Players"
          render={
            <Link
              params={{ organizationSlug, teamId: activeTeam.id }}
              to="/$organizationSlug/$teamId/players"
            />
          }
        >
          Players
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink
          title={player.name}
          render={
            <Link
              params={{
                organizationSlug,
                teamId: activeTeam.id,
                playerId: player.id,
              }}
              to="/$organizationSlug/$teamId/players/$playerId"
            />
          }
        >
          {player.name}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink
          title="Edit"
          render={
            <Link
              params={{
                organizationSlug,
                teamId: activeTeam.id,
                playerId: player.id,
              }}
              to="/$organizationSlug/$teamId/players/$playerId/edit"
            />
          }
        >
          Edit
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
