import type { TeamPlayerWithInfo } from "@laxdb/core/player/player.schema";
import { createFileRoute } from "@tanstack/react-router";
import type { Table } from "@tanstack/react-table";
import { Mail } from "lucide-react";
import {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarActions,
  BulkEditToolbarCopyAction,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarSelection,
  BulkEditToolbarSeparator,
} from "@laxdb/ui/components/data-table/data-table-bulk-edit-toolbar";
import { useDataTable } from "@laxdb/ui/components/data-table/use-data-table";
import { useBulkDeletePlayers } from "../-mutations";

const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/players/",
)();

const getPlayerIds = (table: Table<TeamPlayerWithInfo>) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  return selectedRows.map((row) => row.original.publicId);
};

export function PlayersToolbar() {
  const { activeOrganization } = Route.useRouteContext();
  const { table } = useDataTable<TeamPlayerWithInfo>();
  const rowSelection = table.getState().rowSelection;

  const bulkDelete = useBulkDeletePlayers(activeOrganization.id);

  const onDelete = () => {
    const playerIds = getPlayerIds(table);
    bulkDelete.mutate({ playerIds });
    table.resetRowSelection();
  };

  return (
    <BulkEditProvider
      actions={{ onDelete }}
      rowSelection={rowSelection}
      table={table}
    >
      <BulkEditToolbar>
        <BulkEditToolbarSelection />
        <BulkEditToolbarSeparator />
        <BulkEditToolbarActions>
          <BulkEditToolbarCopyAction
            columnId="email"
            icon={Mail}
            tooltipContent="Copy Emails"
          />
          <BulkEditToolbarSeparator />
          <BulkEditToolbarDeleteAction />
        </BulkEditToolbarActions>
      </BulkEditToolbar>
    </BulkEditProvider>
  );
}
