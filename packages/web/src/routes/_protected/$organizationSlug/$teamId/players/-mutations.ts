import {
  AddNewPlayerToTeamInput,
  AddPlayerToTeamInput,
  BulkRemovePlayersFromTeamInput,
  CreatePlayerInput,
  RemovePlayerFromTeamInput,
  type TeamPlayerWithInfo,
} from "@laxdb/core/player/player.schema";
import { PlayerService } from "@laxdb/core/player/player.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { toast } from "sonner";
import { authMiddleware } from "@/lib/middleware";
import {
  getTeamPlayersQK,
  useBulkDeletePlayersBase,
  useDeletePlayerBase,
  useUpdatePlayerBase,
} from "@/mutations/players";

// Update player
const useUpdatePlayer = (organizationId: string, teamId: string) => {
  const mutation = useUpdatePlayerBase(
    getTeamPlayersQK(organizationId, teamId),
  );

  const handleUpdate = (
    publicPlayerId: string,
    updates: Partial<TeamPlayerWithInfo>,
  ) => {
    const { jerseyNumber, ...rest } = updates;

    mutation.mutate({
      ...rest,
      ...(jerseyNumber !== undefined && { jerseyNumber }),
      publicPlayerId,
      teamId,
    });
  };

  return {
    mutation,
    handleUpdate,
  };
};

// Add player to team
export const AddNewPlayerWithTeamInput = Schema.extend(
  CreatePlayerInput,
  AddNewPlayerToTeamInput,
);

export const addNewPlayerToTeamFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof AddNewPlayerWithTeamInput.Type) =>
    Schema.decodeSync(AddNewPlayerWithTeamInput)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.create({
          organizationId: data.organizationId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          userId: data.userId,
        });
      }),
    ),
  );

export function useAddNewPlayerToTeam(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddNewPlayerWithTeamInput.Type) =>
      addNewPlayerToTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);
      const optimisticPlayer: TeamPlayerWithInfo = {
        publicId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        organizationId: variables.organizationId,
        name: variables.name,
        email: variables.email ?? null,
        phone: variables.phone ?? null,
        dateOfBirth: variables.dateOfBirth ?? null,
        jerseyNumber: variables.jerseyNumber ?? null,
        position: variables.position ?? null,
        teamId: variables.teamId,
        userId: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      };

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) => [
        ...old,
        optimisticPlayer,
      ]);

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error("Failed to add player to team");
    },
  });
}

// Remove player from team
export const removePlayerFromTeamFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof RemovePlayerFromTeamInput.Type) =>
    Schema.decodeSync(RemovePlayerFromTeamInput)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.removePlayerFromTeam(data);
      }),
    ),
  );

export function useRemovePlayerFromTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof RemovePlayerFromTeamInput.Type) =>
      removePlayerFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => p.publicId !== variables.playerId),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error("Failed to remove player from team");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

// Bulk remove players from team
export const bulkRemovePlayersFromTeamFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof BulkRemovePlayersFromTeamInput.Type) =>
    Schema.decodeSync(BulkRemovePlayersFromTeamInput)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.bulkRemovePlayersFromTeam(data);
      }),
    ),
  );

export function useBulkRemovePlayersFromTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof BulkRemovePlayersFromTeamInput.Type) =>
      bulkRemovePlayersFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => !variables.playerIds.includes(p.publicId)),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error("Failed to remove players from team");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

// Bulk delete players
const useBulkDeletePlayers = (organizationId: string, teamId: string) =>
  useBulkDeletePlayersBase(getTeamPlayersQK(organizationId, teamId));

// Delete player
export const useDeletePlayer = (organizationId: string, teamId: string) =>
  useDeletePlayerBase(getTeamPlayersQK(organizationId, teamId));

// Link existing player to team (replace current player)
const LinkPlayerServerInputSchema = Schema.Struct({
  currentPlayerId: Schema.String,
  newPlayerId: Schema.String,
  newPlayerData: Schema.Struct({
    publicId: Schema.String,
    name: Schema.NullOr(Schema.String),
    email: Schema.NullOr(Schema.String),
    phone: Schema.NullOr(Schema.String),
    dateOfBirth: Schema.NullOr(Schema.String),
    organizationId: Schema.String,
  }),
  teamId: Schema.String,
  jerseyNumber: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
});

export const LinkPlayerInputSchema = Schema.Struct({
  currentPlayerId: Schema.String,
  newPlayerData: Schema.Struct({
    publicId: Schema.String,
    name: Schema.NullOr(Schema.String),
    email: Schema.NullOr(Schema.String),
    phone: Schema.NullOr(Schema.String),
    dateOfBirth: Schema.NullOr(Schema.String),
    organizationId: Schema.String,
  }),
  jerseyNumber: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
});

export const linkPlayerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof LinkPlayerServerInputSchema.Type) =>
    Schema.decodeSync(LinkPlayerServerInputSchema)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;

        yield* playerService.removePlayerFromTeam({
          teamId: data.teamId,
          playerId: data.currentPlayerId,
        });

        yield* playerService.addPlayerToTeam({
          publicPlayerId: data.newPlayerData.publicId,
          teamId: data.teamId,
          jerseyNumber: data.jerseyNumber,
          position: data.position,
        });

        return data.newPlayerData;
      }),
    ),
  );

export function useLinkPlayer(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof LinkPlayerInputSchema.Type) =>
      linkPlayerFn({
        data: {
          ...data,
          newPlayerId: data.newPlayerData.publicId,
          teamId,
        },
      }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.map((player) =>
          player.publicId === variables.currentPlayerId
            ? {
                ...player,
                publicId: variables.newPlayerData.publicId,
                name: variables.newPlayerData.name,
                email: variables.newPlayerData.email,
                phone: variables.newPlayerData.phone,
                dateOfBirth: variables.newPlayerData.dateOfBirth,
                organizationId: variables.newPlayerData.organizationId,
              }
            : player,
        ),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error("Failed to link player");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

// Add existing player to team (without creating player)
export const addExistingPlayerToTeamFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof AddPlayerToTeamInput.Type) =>
    Schema.decodeSync(AddPlayerToTeamInput)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.addPlayerToTeam(data);
      }),
    ),
  );

export function useAddExistingPlayerToTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddPlayerToTeamInput.Type) =>
      addExistingPlayerToTeamFn({ data }),
    onError: () => {
      toast.error("Failed to add existing player to team");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

// Combined hook
export function usePlayerMutations(organizationId: string, teamId: string) {
  const addExisting = useAddExistingPlayerToTeam(organizationId, teamId);
  const update = useUpdatePlayer(organizationId, teamId);
  const add = useAddNewPlayerToTeam(organizationId, teamId);
  const link = useLinkPlayer(organizationId, teamId);
  const remove = useRemovePlayerFromTeam(organizationId, teamId);
  const deletePlayer = useDeletePlayer(organizationId, teamId);
  const bulkDelete = useBulkDeletePlayers(organizationId, teamId);
  const bulkRemove = useBulkRemovePlayersFromTeam(organizationId, teamId);

  return {
    addExisting,
    update,
    add,
    link,
    remove,
    delete: deletePlayer,
    bulkDelete,
    bulkRemove,
  };
}
