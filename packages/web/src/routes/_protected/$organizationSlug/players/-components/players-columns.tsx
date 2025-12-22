import type { TeamPlayerWithInfo } from '@laxdb/core/player/player.schema';
import {
  EmailSchema,
  JerseyNumberSchema,
  PlayerNameSchema,
} from '@laxdb/core/schema';
import { Link } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Schema } from 'effect';
import { User2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  RowActionDeleteItem,
  RowActionItem,
  RowActionSeparator,
  RowActionsDropdown,
  RowActionsProvider,
} from '@/components/data-table/data-table-row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { ControlledInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { POSITION_SELECT_FIELDS } from '@/lib/constants';
import { usePlayerMutations, useUpdatePlayer } from '../-mutations';

const columnHelper = createColumnHelper<TeamPlayerWithInfo>();

type EditablePlayerColumnsProps = {
  organizationId: string;
  organizationSlug: string;
};

export function createEditablePlayerColumns({
  organizationId,
  organizationSlug,
}: EditablePlayerColumnsProps) {
  return [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          className="translate-y-0.5"
          onCheckedChange={() => table.toggleAllPageRowsSelected()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={() => row.toggleSelected()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        displayName: 'Select',
      },
    }),
    columnHelper.accessor('jerseyNumber', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#" />
      ),
      enableSorting: true,
      meta: {
        className: 'w-16',
        displayName: 'Jersey Number',
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
                if (result._tag === 'Left') {
                  toast.error('Jersey number must be between 0 and 1000');
                  return;
                }
              }

              // handleUpdate(player.publicId, { jerseyNumber: numValue });
            }}
            placeholder="#"
            type="number"
            value={player.jerseyNumber ?? ''}
            variant="data"
          />
        );
      },
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Name',
      },
      cell: ({ row }) => {
        const player = row.original;
        const { mutation: _ } = useUpdatePlayer(organizationId);

        return (
          <ControlledInput
            key={`playerId-${player.publicId}`}
            onUpdate={(newName) => {
              const nameValue = newName || null;

              if (nameValue) {
                const result =
                  Schema.decodeUnknownEither(PlayerNameSchema)(nameValue);

                if (result._tag === 'Left') {
                  toast.error(
                    'Player name must be between 1 and 100 characters'
                  );
                  return;
                }
              }

              // mutation.mutate(player.publicId, { name: nameValue });
            }}
            placeholder="Player name"
            type="text"
            value={player.name ?? ''}
            variant="data"
          />
        );
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;
        // const linkPlayer = mutations.link;

        // const excludePlayerIds = table.options.meta?.excludePlayerIds;

        // return (
        //   <PlayerReplaceCombobox
        //     organizationId={organizationId}
        //     value={player.name ?? ''}
        //     excludePlayerIds={excludePlayerIds ?? []}
        //     onSelect={(selectedPlayer) => {
        //       linkPlayer.mutate({
        //         currentPlayerId: player.publicId,
        //         existingPlayer: {
        //           id: selectedPlayer.id,
        //           name: selectedPlayer.name,
        //           email: selectedPlayer.email,
        //           phone: selectedPlayer.phone,
        //           dateOfBirth: selectedPlayer.dateOfBirth,
        //           organizationId: selectedPlayer.organizationId,
        //         },
        //         jerseyNumber: player.jerseyNumber ?? null,
        //         position: player.position ?? null,
        //       });
        //     }}
        //     onRename={(newName) => {
        //       handleUpdate(player.publicId, { name: newName });
        //     }}
        //   />
        // );
      },
    }),
    columnHelper.accessor('position', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Position" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Position',
      },
      filterFn: 'arrIncludesSome',
      cell: ({ row }) => {
        const player = row.original;
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;

        return (
          <Select
            onValueChange={(_value) => {
              // handleUpdate(player.publicId, { position: value });
            }}
            value={player.position || ''}
          >
            <SelectTrigger variant="data">
              <SelectValue placeholder="Select position" />
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
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Email',
      },
      cell: ({ row: { original: player } }) => {
        // const mutations = usePlayerMutations(organizationId, teamId);
        // const handleUpdate = mutations.update.handleUpdate;

        return (
          <ControlledInput
            key={`email-${player.publicId}`}
            onUpdate={(newValue) => {
              const emailValue = newValue || null;

              if (emailValue) {
                const result =
                  Schema.decodeUnknownEither(EmailSchema)(emailValue);
                if (result._tag === 'Left') {
                  toast.error('Please enter a valid email address');
                  return;
                }
              }

              // handleUpdate(player.publicId, { email: emailValue });
            }}
            placeholder="email@example.com"
            type="email"
            value={player.email || ''}
            variant="data"
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: 'text-right w-32',
        displayName: 'Actions',
      },
      cell: ({ row }) => {
        const player = row.original;

        const mutations = usePlayerMutations(organizationId);

        return (
          <RowActionsProvider
            actions={{
              onDelete: () =>
                mutations.delete.mutate({ playerId: player.publicId }),
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
      },
    }),
  ] as ColumnDef<any>[];
}
