import { Rpc, RpcGroup } from '@effect/rpc';
import { PlayerContract } from '@laxdb/core/player/player.contract';
import { PlayerService } from '@laxdb/core/player/player.service';
import { Effect, Layer } from 'effect';

export class PlayerRpcs extends RpcGroup.make(
  Rpc.make('PlayerList', {
    success: PlayerContract.list.success,
    error: PlayerContract.list.error,
    payload: PlayerContract.list.payload,
  }),
  Rpc.make('PlayerCreate', {
    success: PlayerContract.create.success,
    error: PlayerContract.create.error,
    payload: PlayerContract.create.payload,
  }),
  Rpc.make('PlayerUpdate', {
    success: PlayerContract.update.success,
    error: PlayerContract.update.error,
    payload: PlayerContract.update.payload,
  }),
  Rpc.make('PlayerDelete', {
    success: PlayerContract.delete.success,
    error: PlayerContract.delete.error,
    payload: PlayerContract.delete.payload,
  }),
  Rpc.make('PlayerBulkDelete', {
    success: PlayerContract.bulkDelete.success,
    error: PlayerContract.bulkDelete.error,
    payload: PlayerContract.bulkDelete.payload,
  }),
  Rpc.make('PlayerGetTeamPlayers', {
    success: PlayerContract.getTeamPlayers.success,
    error: PlayerContract.getTeamPlayers.error,
    payload: PlayerContract.getTeamPlayers.payload,
  }),
  Rpc.make('PlayerAddToTeam', {
    success: PlayerContract.addPlayerToTeam.success,
    error: PlayerContract.addPlayerToTeam.error,
    payload: PlayerContract.addPlayerToTeam.payload,
  }),
  Rpc.make('PlayerUpdateTeam', {
    success: PlayerContract.updateTeamPlayer.success,
    error: PlayerContract.updateTeamPlayer.error,
    payload: PlayerContract.updateTeamPlayer.payload,
  }),
  Rpc.make('PlayerRemoveFromTeam', {
    success: PlayerContract.removePlayerFromTeam.success,
    error: PlayerContract.removePlayerFromTeam.error,
    payload: PlayerContract.removePlayerFromTeam.payload,
  }),
  Rpc.make('PlayerBulkRemoveFromTeam', {
    success: PlayerContract.bulkRemovePlayersFromTeam.success,
    error: PlayerContract.bulkRemovePlayersFromTeam.error,
    payload: PlayerContract.bulkRemovePlayersFromTeam.payload,
  })
) {}

export const PlayerHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return {
      PlayerList: (payload) => service.getAll(payload),
      PlayerCreate: (payload) => service.create(payload),
      PlayerUpdate: (payload) => service.updatePlayer(payload),
      PlayerDelete: (payload) => service.deletePlayer(payload),
      PlayerBulkDelete: (payload) => service.bulkDeletePlayers(payload),
      PlayerGetTeamPlayers: (payload) => service.getTeamPlayers(payload),
      PlayerAddToTeam: (payload) => service.addPlayerToTeam(payload),
      PlayerUpdateTeam: (payload) => service.updateTeamPlayer(payload),
      PlayerRemoveFromTeam: (payload) => service.removePlayerFromTeam(payload),
      PlayerBulkRemoveFromTeam: (payload) =>
        service.bulkRemovePlayersFromTeam(payload),
    };
  })
).pipe(Layer.provide(PlayerService.Default));
