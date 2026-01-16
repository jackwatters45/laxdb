import type { Player } from "@laxdb/core/player/player.sql";
import {
  SearchComboboxAction,
  SearchComboboxContent,
  SearchComboboxEmpty,
  SearchComboboxGroup,
  SearchComboboxInput,
  SearchComboboxItem,
  SearchComboboxList,
  SearchComboboxLoading,
  SearchComboboxProvider,
  SearchComboboxRoot,
  SearchComboboxSeparator,
  SearchComboboxTrigger,
  useSearchCombobox,
} from "@laxdb/ui/components/ui/search-combobox";
import { useQuery } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useMemo } from "react";

import { getOrgPlayersQK } from "@/mutations/players";
import { getOrganizationPlayers } from "@/query/players";

export function PlayerReplaceCombobox({
  organizationId,
  onSelect,
  onRename,
  value,
  excludePlayerIds = [],
}: {
  organizationId: string;
  onSelect: (player: Player) => void;
  onRename: (newName: string) => void;
  value?: string;
  excludePlayerIds?: string[];
}) {
  const { data: allPlayers = [], isLoading } = useQuery({
    queryKey: getOrgPlayersQK(organizationId),
    queryFn: () => getOrganizationPlayers({ data: { organizationId } }),
  });

  const filteredPlayers = useMemo(() => {
    const availablePlayers = allPlayers.filter(
      (player) => !excludePlayerIds.includes(player.publicId),
    );
    return availablePlayers;
  }, [allPlayers, excludePlayerIds]);

  return (
    <SearchComboboxProvider
      getItemValue={(player) => player.name ?? ""}
      isLoading={isLoading}
      items={filteredPlayers}
      onSelect={onSelect}
      value={value}
    >
      <SearchComboboxRoot>
        <SearchComboboxTrigger placeholder={"Search or swap player..."} />
        <SearchComboboxContent>
          <SearchComboboxInput placeholder="Swap player..." />
          <SearchComboboxList>
            {isLoading ? (
              <SearchComboboxLoading />
            ) : (
              <>
                <SearchComboboxEmpty>
                  {(query) =>
                    query
                      ? `No players found named '${query}'`
                      : "No players to add to team. Try creating a new player."
                  }
                </SearchComboboxEmpty>
                <FilteredPlayerItemsWithGroup />
                <RenamePlayerOption onRename={onRename} />
              </>
            )}
          </SearchComboboxList>
        </SearchComboboxContent>
      </SearchComboboxRoot>
    </SearchComboboxProvider>
  );
}

function FilteredPlayerItemsWithGroup() {
  const { items, searchQuery } = useSearchCombobox<Player>();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter(
      (player) =>
        player.name?.toLowerCase().includes(query) ??
        player.email?.toLowerCase().includes(query) ??
        player.phone?.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <SearchComboboxGroup heading="Organization Players">
      {filtered.map((player) => (
        <SearchComboboxItem item={player} key={player.publicId}>
          {(player) => (
            <div className="flex flex-col">
              <span>{player.name ?? "Unnamed"}</span>
              {(player.email ?? player.phone) && (
                <span className="text-xs text-muted-foreground">
                  {player.email ?? player.phone}
                </span>
              )}
            </div>
          )}
        </SearchComboboxItem>
      ))}
    </SearchComboboxGroup>
  );
}

function RenamePlayerOption({
  onRename,
}: {
  onRename: (newName: string) => void;
}) {
  const { searchQuery } = useSearchCombobox();

  if (!searchQuery.trim()) {
    return null;
  }

  return (
    <>
      <SearchComboboxSeparator />
      <SearchComboboxGroup>
        <SearchComboboxAction
          onSelect={() => {
            onRename(searchQuery.trim());
          }}
        >
          <Edit className="h-4 w-4" />
          <span>
            Rename to <strong>&quot;{searchQuery.trim()}&quot;</strong>
          </span>
        </SearchComboboxAction>
      </SearchComboboxGroup>
    </>
  );
}
