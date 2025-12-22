import {
  getOrgPlayersQK,
  useBulkDeletePlayersBase,
  useDeletePlayerBase,
  useUpdatePlayerBase,
} from '@/mutations/players';

export const useBulkDeletePlayers = (organizationId: string) =>
  useBulkDeletePlayersBase(getOrgPlayersQK(organizationId));

export const useDeletePlayer = (organizationId: string) =>
  useDeletePlayerBase(getOrgPlayersQK(organizationId));

export const useUpdatePlayer = (organizationId: string) => {
  const mutation = useUpdatePlayerBase(getOrgPlayersQK(organizationId));

  // const handleUpdate = (
  //   playerId: string,
  //   updates: PartialNullable<Omit<TeamPlayerWithInfo, 'teamId'>>,
  // ) => {
  //   mutation.mutate({
  //     ...updates,
  //     playerId,
  //   });
  // };

  return {
    mutation,
    // handleUpdate,
  };
};

// Combined hook
export function usePlayerMutations(organizationId: string) {
  const update = useUpdatePlayer(organizationId);
  // const add = useAddPlayerToTeam(organizationId, teamId);
  const deletePlayer = useDeletePlayer(organizationId);
  const bulkDelete = useBulkDeletePlayers(organizationId);

  return {
    update,
    // add,
    delete: deletePlayer,
    bulkDelete,
  };
}
