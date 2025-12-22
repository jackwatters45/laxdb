import { Effect } from 'effect';
import { decodeArguments, parsePostgresError } from '../../util';
import { ContactInfoRepo } from './contact-info.repo';
import { GetPlayerContactInfoInput } from './contact-info.schema';

export class PlayerContactInfoService extends Effect.Service<PlayerContactInfoService>()(
  'PlayerContactInfoService',
  {
    effect: Effect.gen(function* () {
      const contactInfoRepo = yield* ContactInfoRepo;

      return {
        getPlayerWithContactInfo: (input: GetPlayerContactInfoInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              GetPlayerContactInfoInput,
              input
            );
            return yield* contactInfoRepo.getPlayerWithContactInfo(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.succeed(null)
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((result) =>
              Effect.log(
                result
                  ? `Found contact info for player ${input.playerId}`
                  : `No contact info found for player ${input.playerId}`
              )
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to get player contact info', error)
            )
          ),
      } as const;
    }),
    dependencies: [ContactInfoRepo.Default],
  }
) {}
