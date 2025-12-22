import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getOrgPlayersQK } from '@/mutations/players';
import { getOrganizationPlayers } from '@/query/players';
import { usePlayerMutations } from '../-mutations';

export function AddPlayerCommand({
  organizationId,
  children,
}: {
  organizationId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allPlayers = [], isLoading } = useQuery({
    queryKey: getOrgPlayersQK(organizationId),
    queryFn: () => getOrganizationPlayers({ data: { organizationId } }),
    enabled: open,
  });

  const _mutations = usePlayerMutations(organizationId);

  const handleCreateNewPlayer = (_name: string) => {
    // mutations.add.mutate({
    //   organizationId,
    //   name,
    //   email: null,
    //   phone: null,
    //   dateOfBirth: null,
    //   jerseyNumber: null,
    //   position: null,
    //   userId: null,
    // });
  };

  const handleCreate = () => {
    if (!searchQuery.trim()) {
      return;
    }
    handleCreateNewPlayer(searchQuery);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
                {allPlayers.length > 0 && (
                  <>
                    <CommandGroup heading="Existing Players">
                      {allPlayers.map((player) => (
                        <CommandItem
                          key={player.publicId}
                          value={player.publicId}
                        >
                          <div className="flex flex-col">
                            <span>{player.name || 'Unnamed'}</span>
                            {(player.email || player.phone) && (
                              <span className="text-muted-foreground text-xs">
                                {player.email || player.phone}
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
                      Create "{searchQuery}"
                    </CommandItem>
                  </CommandGroup>
                )}
                {!searchQuery && (
                  <CommandEmpty>
                    Type a name to create a new player
                  </CommandEmpty>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
