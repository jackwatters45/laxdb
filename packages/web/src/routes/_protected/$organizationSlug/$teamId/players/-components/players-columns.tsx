import type { TeamPlayerWithInfo } from "@laxdb/core/player/player.schema";
import { EmailSchema, JerseyNumberSchema } from "@laxdb/core/schema";
import { DataTableColumnHeader } from "@laxdb/ui/components/data-table/data-table-column-header";
import {
  RowActionDeleteItem,
  RowActionItem,
  RowActionRemoveItem,
  RowActionSeparator,
  RowActionsDropdown,
  RowActionsProvider,
} from "@laxdb/ui/components/data-table/data-table-row-actions";
import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import { ControlledInput } from "@laxdb/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  type Row,
  createColumnHelper,
} from "@tanstack/react-table";
import { Schema } from "effect";
import { User2 } from "lucide-react";
import { toast } from "sonner";

import { POSITION_SELECT_FIELDS } from "@/lib/constants";

import { usePlayerMutations } from "../-mutations";

import { PlayerReplaceCombobox } from "./player-replace-combobox";

const columnHelper = createColumnHelper<TeamPlayerWithInfo>();

type CellProps = {
  organizationId: string;
  teamId: string;
  player: TeamPlayerWithInfo;
};

type NameCellProps = CellProps & {
  excludePlayerIds: string[];
};

type ActionsCellProps = CellProps & {
  organizationSlug: string;
  row: Row<TeamPlayerWithInfo>;
};

function JerseyNumberCell({ organizationId, teamId, player }: CellProps) {
  const mutations = usePlayerMutations(organizationId, teamId);
  const handleUpdate = mutations.update.handleUpdate;

  return (
    <ControlledInput
      key={`jersey-${player.publicId}`}
      onUpdate={(newValue) => {
        const numValue = newValue ? Number(newValue) : null;

        if (numValue !== null) {
          const result =
            Schema.decodeUnknownEither(JerseyNumberSchema)(numValue);
          if (result._tag === "Left") {
            toast.error("Jersey number must be between 0 and 1000");
            return;
          }
        }

        handleUpdate(player.publicId, { jerseyNumber: numValue });
      }}
      placeholder="#"
      type="number"
      value={player.jerseyNumber ?? ""}
      variant="data"
    />
  );
}

function NameCell({
  organizationId,
  teamId,
  player,
  excludePlayerIds,
}: NameCellProps) {
  const mutations = usePlayerMutations(organizationId, teamId);
  const handleUpdate = mutations.update.handleUpdate;
  const linkPlayer = mutations.link;

  return (
    <PlayerReplaceCombobox
      excludePlayerIds={excludePlayerIds}
      onRename={(newName) => {
        handleUpdate(player.publicId, { name: newName });
      }}
      onSelect={(selectedPlayer) => {
        linkPlayer.mutate({
          currentPlayerId: player.publicId,
          newPlayerData: {
            publicId: selectedPlayer.publicId,
            name: selectedPlayer.name,
            email: selectedPlayer.email,
            phone: selectedPlayer.phone,
            dateOfBirth: selectedPlayer.dateOfBirth,
            organizationId: selectedPlayer.organizationId,
          },
          jerseyNumber: player.jerseyNumber ?? null,
          position: player.position ?? null,
        });
      }}
      organizationId={organizationId}
      value={player.name ?? ""}
    />
  );
}

function PositionCell({ organizationId, teamId, player }: CellProps) {
  const mutations = usePlayerMutations(organizationId, teamId);
  const handleUpdate = mutations.update.handleUpdate;

  return (
    <Select
      onValueChange={(value) => {
        handleUpdate(player.publicId, { position: value });
      }}
      value={player.position ?? ""}
    >
      <SelectTrigger variant="data">
        <SelectValue>
          {(value: string | null) => value ?? "Select position"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {POSITION_SELECT_FIELDS.map((position) => (
          <SelectItem key={position.value} value={position.value}>
            {position.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmailCell({ organizationId, teamId, player }: CellProps) {
  const mutations = usePlayerMutations(organizationId, teamId);
  const handleUpdate = mutations.update.handleUpdate;

  return (
    <ControlledInput
      key={`email-${player.publicId}`}
      onUpdate={(newValue) => {
        const emailValue = newValue ?? null;

        if (emailValue) {
          const result = Schema.decodeUnknownEither(EmailSchema)(emailValue);
          if (result._tag === "Left") {
            toast.error("Please enter a valid email address");
            return;
          }
        }

        handleUpdate(player.publicId, { email: emailValue });
      }}
      placeholder="email@example.com"
      type="email"
      value={player.email ?? ""}
      variant="data"
    />
  );
}

function ActionsCell({
  organizationId,
  organizationSlug,
  teamId,
  player,
  row,
}: ActionsCellProps) {
  const mutations = usePlayerMutations(organizationId, teamId);

  return (
    <RowActionsProvider
      actions={{
        onDelete: () => {
          mutations.delete.mutate({ playerId: player.publicId });
        },
        onRemove: () => {
          mutations.remove.mutate({ teamId, playerId: player.publicId });
        },
      }}
      row={row}
    >
      <RowActionsDropdown>
        <Link
          params={{ organizationSlug, teamId, playerId: player.publicId }}
          to="/$organizationSlug/$teamId/players/$playerId"
        >
          <RowActionItem icon={User2}>View</RowActionItem>
        </Link>
        <RowActionSeparator />
        <RowActionRemoveItem
          alertDescription="Are you sure you want to remove this player from the team?"
          alertTitle="Remove Player from Team"
        >
          Remove From Team
        </RowActionRemoveItem>
        <RowActionDeleteItem
          alertDescription="Are you sure you want to remove this player from the organization? This action cannot be undone."
          alertTitle="Permanently Delete Player from Organization"
        >
          Delete Player
        </RowActionDeleteItem>
      </RowActionsDropdown>
    </RowActionsProvider>
  );
}

type EditablePlayerColumnsProps = {
  organizationId: string;
  organizationSlug: string;
  teamId: string;
};

export function createEditablePlayerColumns({
  organizationId,
  organizationSlug,
  teamId,
}: EditablePlayerColumnsProps) {
  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomeRowsSelected() && !table.getIsAllPageRowsSelected()
          }
          className="translate-y-0.5"
          onCheckedChange={() => {
            table.toggleAllPageRowsSelected();
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={() => {
            row.toggleSelected();
          }}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        displayName: "Select",
      },
    }),
    columnHelper.accessor("jerseyNumber", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#" />
      ),
      enableSorting: true,
      meta: {
        className: "w-16",
        displayName: "Jersey Number",
      },
      cell: ({ row: { original: player } }) => (
        <JerseyNumberCell
          organizationId={organizationId}
          player={player}
          teamId={teamId}
        />
      ),
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: true,
      meta: {
        className: "text-left",
        displayName: "Name",
      },
      cell: ({ row, table }) => (
        <NameCell
          excludePlayerIds={table.options.meta?.excludePlayerIds ?? []}
          organizationId={organizationId}
          player={row.original}
          teamId={teamId}
        />
      ),
    }),
    columnHelper.accessor("position", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Position" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: "text-left",
        displayName: "Position",
      },
      filterFn: "arrIncludesSome",
      cell: ({ row }) => (
        <PositionCell
          organizationId={organizationId}
          player={row.original}
          teamId={teamId}
        />
      ),
    }),
    columnHelper.accessor("email", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: "text-left",
        displayName: "Email",
      },
      cell: ({ row: { original: player } }) => (
        <EmailCell
          organizationId={organizationId}
          player={player}
          teamId={teamId}
        />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "text-right w-32",
        displayName: "Actions",
      },
      cell: ({ row }) => (
        <ActionsCell
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          player={row.original}
          row={row}
          teamId={teamId}
        />
      ),
    }),
  ] as ColumnDef<TeamPlayerWithInfo>[];
}
