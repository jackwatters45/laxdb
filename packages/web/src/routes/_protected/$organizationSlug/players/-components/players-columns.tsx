import type { TeamPlayerWithInfo } from "@laxdb/core/player/player.schema";
import {
  EmailSchema,
  JerseyNumberSchema,
  PlayerNameSchema,
} from "@laxdb/core/schema";
import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  createColumnHelper,
  type Row,
} from "@tanstack/react-table";
import { Schema } from "effect";
import { User2 } from "lucide-react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@laxdb/ui/components/data-table/data-table-column-header";
import {
  RowActionDeleteItem,
  RowActionItem,
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
import { POSITION_SELECT_FIELDS } from "@/lib/constants";
import { usePlayerMutations } from "../-mutations";

const columnHelper = createColumnHelper<TeamPlayerWithInfo>();

type EditablePlayerColumnsProps = {
  organizationId: string;
  organizationSlug: string;
};

function PlayerActionsCell({
  player,
  organizationId,
  organizationSlug,
  row,
}: {
  player: TeamPlayerWithInfo;
  organizationId: string;
  organizationSlug: string;
  row: Row<TeamPlayerWithInfo>;
}) {
  const mutations = usePlayerMutations(organizationId);

  return (
    <RowActionsProvider
      actions={{
        onDelete: () => {
          mutations.delete.mutate({ playerId: player.publicId });
        },
      }}
      row={row}
    >
      <RowActionsDropdown>
        <Link
          params={{
            organizationSlug,
            playerId: player.publicId,
          }}
          to="/$organizationSlug/players/$playerId"
        >
          <RowActionItem icon={User2}>View</RowActionItem>
        </Link>
        <RowActionSeparator />
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

export function createEditablePlayerColumns({
  organizationId,
  organizationSlug,
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
      cell: ({ row: { original: player } }) => {
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;

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
                }
              }

              // handleUpdate(player.publicId, { jerseyNumber: numValue });
            }}
            placeholder="#"
            type="number"
            value={player.jerseyNumber ?? ""}
            variant="data"
          />
        );
      },
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
      cell: ({ row }) => {
        const player = row.original;

        return (
          <ControlledInput
            key={`playerId-${player.publicId}`}
            onUpdate={(newName) => {
              const nameValue = newName ?? null;

              if (nameValue) {
                const result =
                  Schema.decodeUnknownEither(PlayerNameSchema)(nameValue);

                if (result._tag === "Left") {
                  toast.error(
                    "Player name must be between 1 and 100 characters",
                  );
                }
              }

              // TODO: mutation.mutate(player.publicId, { name: nameValue });
            }}
            placeholder="Player name"
            type="text"
            value={player.name ?? ""}
            variant="data"
          />
        );
      },
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
      cell: ({ row }) => {
        const player = row.original;
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;

        return (
          <Select
            onValueChange={(_value) => {
              // handleUpdate(player.publicId, { position: value });
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
      },
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
      cell: ({ row: { original: player } }) => {
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;

        return (
          <ControlledInput
            key={`email-${player.publicId}`}
            onUpdate={(newValue) => {
              const emailValue = newValue ?? null;

              if (emailValue) {
                const result =
                  Schema.decodeUnknownEither(EmailSchema)(emailValue);
                if (result._tag === "Left") {
                  toast.error("Please enter a valid email address");
                }
              }

              // handleUpdate(player.publicId, { email: emailValue });
            }}
            placeholder="email@example.com"
            type="email"
            value={player.email ?? ""}
            variant="data"
          />
        );
      },
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
        <PlayerActionsCell
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          player={row.original}
          row={row}
        />
      ),
    }),
  ] as ColumnDef<any>[];
}
