import { PlayerService } from "@laxdb/core/player/player.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { TeamIdSchema } from "@laxdb/core/schema";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { useMemo } from "react";
import {
  DataTableBody,
  DataTableContent,
  DataTableHeader,
  DataTableProvider,
  DataTableRoot,
} from "@/components/data-table/data-table";
import { PageBody } from "@/components/layout/page-content";
import {
  BreadcrumbDropdown,
  BreadcrumbDropdownContent,
  BreadcrumbDropdownItem,
  BreadcrumbDropdownLabel,
  BreadcrumbDropdownSeparator,
  BreadcrumbDropdownTrigger,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { authMiddleware } from "@/lib/middleware";
import { getTeamPlayersQK } from "@/mutations/players";
import { TeamHeader } from "../-components/team-header";
import { PlayerCards } from "./-components/players-cards";
import { createEditablePlayerColumns } from "./-components/players-columns";
import { PlayersFilterBar } from "./-components/players-filterbar";
import { PlayersToolbar } from "./-components/players-toolbar";

const GetTeamPlayers = Schema.Struct({
  ...TeamIdSchema,
});

const getTeamPlayers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetTeamPlayers.Type) =>
    Schema.decodeSync(GetTeamPlayers)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.getTeamPlayers(data);
      }),
    ),
  );

// FIX: more of a replace than an update - make sure updates add user options + exclude ids or something...
export const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/players/",
)({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: getTeamPlayersQK(context.activeOrganization.id, params.teamId),
      queryFn: () => getTeamPlayers({ data: { teamId: params.teamId } }),
    });
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <PageBody className="py-4">
        <Tabs defaultValue="list">
          <PlayersDataTable />
        </Tabs>
      </PageBody>
    </>
  );
}

function PlayersDataTable() {
  const { organizationSlug, teamId } = Route.useParams();
  const { activeOrganization } = Route.useRouteContext();

  const { data: players = [] } = useQuery({
    queryKey: getTeamPlayersQK(activeOrganization.id, teamId),
    queryFn: () => getTeamPlayers({ data: { teamId } }),
  });

  const columns = useMemo(
    () =>
      createEditablePlayerColumns({
        organizationId: activeOrganization.id,
        organizationSlug,
        teamId,
      }),
    [activeOrganization.id, organizationSlug, teamId],
  );

  const excludePlayerIds = useMemo(
    () => players.map((p) => p.publicId),
    [players],
  );

  return (
    <DataTableProvider
      columns={columns}
      data={players}
      meta={{ excludePlayerIds }}
      showAllRows={true}
    >
      <DataTableRoot>
        <PlayersFilterBar
          excludePlayerIds={players.map((p) => p.publicId)}
          organizationId={activeOrganization.id}
          teamId={teamId}
        />
        <TabsContent value="list">
          <DataTableContent>
            <DataTableHeader />
            <DataTableBody />
          </DataTableContent>
        </TabsContent>
        <TabsContent className="container" value="cards">
          <PlayerCards players={players} />
        </TabsContent>
        <PlayersToolbar />
      </DataTableRoot>
    </DataTableProvider>
  );
}

function Header() {
  const { organizationSlug, teamId } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();

  return (
    <TeamHeader organizationSlug={organizationSlug} teamId={teamId}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Teams">
          <Link params={{ organizationSlug }} to="/$organizationSlug">
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbDropdown>
          <BreadcrumbLink asChild>
            <Link
              params={{ organizationSlug, teamId: activeTeam.id }}
              to="/$organizationSlug/$teamId"
            >
              {activeTeam.name}
            </Link>
          </BreadcrumbLink>
          <BreadcrumbDropdownTrigger />
          <BreadcrumbDropdownContent>
            <BreadcrumbDropdownLabel>Switch Team</BreadcrumbDropdownLabel>
            <BreadcrumbDropdownSeparator />
            {teams.map((team) => (
              <BreadcrumbDropdownItem asChild key={team.id}>
                <Link
                  params={{ organizationSlug, teamId: team.id }}
                  to="/$organizationSlug/$teamId/players"
                >
                  {team.name}
                </Link>
              </BreadcrumbDropdownItem>
            ))}
          </BreadcrumbDropdownContent>
        </BreadcrumbDropdown>
      </BreadcrumbItem>
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
    </TeamHeader>
  );
}
