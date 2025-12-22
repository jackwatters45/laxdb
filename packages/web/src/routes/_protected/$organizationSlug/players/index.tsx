import { PlayerService } from '@laxdb/core/player/player.service';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { OrganizationIdSchema } from '@laxdb/core/schema';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { useMemo } from 'react';
import {
  DataTableBody,
  DataTableContent,
  DataTableHeader,
  DataTableProvider,
  DataTableRoot,
} from '@/components/data-table/data-table';
import { PageBody } from '@/components/layout/page-content';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { authMiddleware } from '@/lib/middleware';
import { getOrgPlayersQK } from '@/mutations/players';
import { createEditablePlayerColumns } from './-components/players-columns';
import { PlayersFilterBar } from './-components/players-filterbar';
import { PlayersHeader } from './-components/players-header';
import { PlayersToolbar } from './-components/players-toolbar';

const GetPlayers = Schema.Struct({
  ...OrganizationIdSchema,
});

const getPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetPlayers.Type) =>
    Schema.decodeSync(GetPlayers)(data)
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.getAll(data);
      })
    )
  );

export const Route = createFileRoute('/_protected/$organizationSlug/players/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: getOrgPlayersQK(context.activeOrganization.id),
      queryFn: () =>
        getPlayers({
          data: { organizationId: context.activeOrganization.id },
        }),
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
  const { organizationSlug } = Route.useParams();
  const { activeOrganization } = Route.useRouteContext();

  const { data: players = [] } = useQuery({
    queryKey: getOrgPlayersQK(activeOrganization.id),
    queryFn: () =>
      getPlayers({ data: { organizationId: activeOrganization.id } }),
  });

  const columns = useMemo(
    () =>
      createEditablePlayerColumns({
        organizationId: activeOrganization.id,
        organizationSlug,
      }),
    [activeOrganization.id, organizationSlug]
  );

  return (
    <DataTableProvider columns={columns} data={players} showAllRows={true}>
      <DataTableRoot>
        <PlayersFilterBar organizationId={activeOrganization.id} />
        <TabsContent value="list">
          <DataTableContent>
            <DataTableHeader />
            <DataTableBody />
          </DataTableContent>
        </TabsContent>
        <TabsContent className="container" value="cards">
          Cards
          {/*<PlayerCards players={players} />*/}
        </TabsContent>
        <PlayersToolbar />
      </DataTableRoot>
    </DataTableProvider>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <PlayersHeader organizationSlug={organizationSlug}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Players">
          <Link params={{ organizationSlug }} to="/$organizationSlug/players">
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayersHeader>
  );
}
