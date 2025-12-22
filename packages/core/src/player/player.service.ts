import { Effect } from 'effect';
import { NotFoundError } from '../error';
import { decodeArguments, parsePostgresError } from '../util';
import { PlayerRepo } from './player.repo';
import {
  AddPlayerToTeamInput,
  BulkDeletePlayersInput,
  BulkRemovePlayersFromTeamInput,
  CreatePlayerInput,
  DeletePlayerInput,
  GetAllPlayersInput,
  GetTeamPlayersInput,
  RemovePlayerFromTeamInput,
  UpdatePlayerInput,
  UpdateTeamPlayerInput,
} from './player.schema';

export class PlayerService extends Effect.Service<PlayerService>()(
  'PlayerService',
  {
    effect: Effect.gen(function* () {
      const playerRepo = yield* PlayerRepo;

      return {
        getAll: (input: GetAllPlayersInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetAllPlayersInput, input);
            return yield* playerRepo.list(decoded);
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((players) =>
              Effect.log(`Found ${players.length} players`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to list players', error)
            )
          ),

        create: (input: CreatePlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreatePlayerInput, input);
            return yield* playerRepo.create(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(new NotFoundError({ domain: 'Player', id: 'create' }))
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((player) =>
              Effect.log(`Created player: ${player.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to create player', error)
            )
          ),

        getTeamPlayers: (input: GetTeamPlayersInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetTeamPlayersInput, input);
            return yield* playerRepo.getTeamPlayers(decoded);
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((players) =>
              Effect.log(`Found ${players.length} team players`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to get team players', error)
            )
          ),

        updatePlayer: (input: UpdatePlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdatePlayerInput, input);
            return yield* playerRepo.update(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({
                  domain: 'Player',
                  id: input.publicPlayerId,
                })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((player) =>
              Effect.log(`Updated player: ${player.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to update player', error)
            )
          ),

        updateTeamPlayer: (input: UpdateTeamPlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              UpdateTeamPlayerInput,
              input
            );

            const playerIdResult = yield* playerRepo.getPlayerIdByPublicId(
              decoded.publicPlayerId
            );

            return yield* playerRepo.updateTeamPlayer(
              playerIdResult.id,
              decoded
            );
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({
                  domain: 'Player',
                  id: input.publicPlayerId,
                })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap(() =>
              Effect.log(`Updated team player: ${input.publicPlayerId}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to update team player', error)
            )
          ),

        addPlayerToTeam: (input: AddPlayerToTeamInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(AddPlayerToTeamInput, input);

            const playerIdResult = yield* playerRepo.getPlayerIdByPublicId(
              decoded.publicPlayerId
            );

            return yield* playerRepo.addPlayerToTeam(
              playerIdResult.id,
              decoded
            );
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({
                  domain: 'Player',
                  id: input.publicPlayerId,
                })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap(() =>
              Effect.log(
                `Added player ${input.publicPlayerId} to team ${input.teamId}`
              )
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to add player to team', error)
            )
          ),

        removePlayerFromTeam: (input: RemovePlayerFromTeamInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              RemovePlayerFromTeamInput,
              input
            );

            const playerIdResult = yield* playerRepo.getPlayerIdByPublicId(
              decoded.playerId
            );

            yield* playerRepo.removePlayerFromTeam(
              playerIdResult.id,
              decoded.teamId
            );
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: 'Player', id: input.playerId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap(() =>
              Effect.log(
                `Removed player ${input.playerId} from team ${input.teamId}`
              )
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to remove player from team', error)
            )
          ),

        bulkRemovePlayersFromTeam: (input: BulkRemovePlayersFromTeamInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              BulkRemovePlayersFromTeamInput,
              input
            );

            const players = yield* playerRepo.getPlayerIdsByPublicIds([
              ...decoded.playerIds,
            ]);

            const playerIds = players.map((p) => p.id);

            yield* playerRepo.bulkRemovePlayersFromTeam(
              playerIds,
              decoded.teamId
            );
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap(() =>
              Effect.log(
                `Removed ${input.playerIds.length} players from team ${input.teamId}`
              )
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to bulk remove players from team', error)
            )
          ),

        deletePlayer: (input: DeletePlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeletePlayerInput, input);
            return yield* playerRepo.delete(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: 'Player', id: input.playerId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((player) =>
              Effect.log(`Deleted player: ${player.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to delete player', error)
            )
          ),

        bulkDeletePlayers: (input: BulkDeletePlayersInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              BulkDeletePlayersInput,
              input
            );
            yield* playerRepo.bulkDelete(decoded);
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap(() =>
              Effect.log(`Deleted ${input.playerIds.length} players`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to bulk delete players', error)
            )
          ),
      } as const;
    }),
    dependencies: [PlayerRepo.Default],
  }
) {}
