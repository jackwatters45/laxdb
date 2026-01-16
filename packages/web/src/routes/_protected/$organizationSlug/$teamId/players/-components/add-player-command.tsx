import type { Player } from "@laxdb/core/player/player.sql";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@laxdb/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@laxdb/ui/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";

import { getOrgPlayersQK } from "@/mutations/players";
import { getOrganizationPlayers } from "@/query/players";

import { usePlayerMutations } from "../-mutations";

export function AddPlayerCommand({
  organizationId,
  teamId,
  excludePlayerIds,
  children,
}: {
  organizationId: string;
  teamId: string;
  excludePlayerIds: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allPlayers = [], isLoading } = useQuery({
    queryKey: getOrgPlayersQK(organizationId),
    queryFn: () => getOrganizationPlayers({ data: { organizationId } }),
    enabled: open,
  });

  const mutations = usePlayerMutations(organizationId, teamId);

  const handleCreateNewPlayer = (name: string) => {
    mutations.add.mutate({
      organizationId,
      teamId,
      name,
      email: null,
      phone: null,
      dateOfBirth: null,
      jerseyNumber: null,
      position: null,
      userId: null,
    });
  };

  const handleSelectExistingPlayer = (player: { publicId: string }) => {
    // Just add existing player to team (they already exist in org)
    mutations.addExisting.mutate({
      publicPlayerId: player.publicId,
      teamId,
      jerseyNumber: null,
      position: null,
    });
  };

  const filteredPlayers = allPlayers
    .filter((player) => !excludePlayerIds.includes(player.publicId))
    .filter((player) => {
      if (!searchQuery.trim()) {
        return true;
      }
      const query = searchQuery.toLowerCase();
      return (
        player.name?.toLowerCase().includes(query) ??
        player.email?.toLowerCase().includes(query) ??
        player.phone?.toLowerCase().includes(query)
      );
    });

  const handleSelect = (player: Player) => {
    handleSelectExistingPlayer(player);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCreate = () => {
    if (!searchQuery.trim()) {
      return;
    }
    handleCreateNewPlayer(searchQuery);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
      // asChild
      >
        {children}
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchQuery}
            placeholder="Search or create player..."
            value={searchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : (
              <>
                {filteredPlayers.length > 0 && (
                  <>
                    <CommandGroup heading="Existing Players">
                      {filteredPlayers.map((player) => (
                        <CommandItem
                          key={player.publicId}
                          onSelect={() => {
                            handleSelect(player);
                          }}
                          value={player.publicId}
                        >
                          <div className="flex flex-col">
                            <span>{player.name ?? "Unnamed"}</span>
                            {(player.email ?? player.phone) && (
                              <span className="text-xs text-muted-foreground">
                                {player.email ?? player.phone}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                {searchQuery && (
                  <CommandGroup>
                    <CommandItem onSelect={handleCreate}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create &quot;{searchQuery}&quot;
                    </CommandItem>
                  </CommandGroup>
                )}
                {!searchQuery && filteredPlayers.length === 0 && (
                  <CommandEmpty>Type a name to create a new player</CommandEmpty>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
