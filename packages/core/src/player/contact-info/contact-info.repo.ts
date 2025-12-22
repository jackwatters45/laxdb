import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { eq, getTableColumns } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../../drizzle/drizzle.service';
import { playerTable } from '../player.sql';
import type {
  GetPlayerContactInfoInput,
  PlayerWithContactInfo,
} from './contact-info.schema';
import { playerContactInfoTable } from './contact-info.sql';

export class ContactInfoRepo extends Effect.Service<ContactInfoRepo>()(
  'ContactInfoRepo',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _id, ...rest } = getTableColumns(playerContactInfoTable);

      return {
        getPlayerWithContactInfo: (input: GetPlayerContactInfoInput) =>
          db
            .select({
              ...rest,
              publicPlayerId: playerTable.publicId,
              name: playerTable.name,
            })
            .from(playerTable)
            .leftJoin(
              playerContactInfoTable,
              eq(playerTable.id, playerContactInfoTable.playerId)
            )
            .where(eq(playerTable.id, input.playerId))
            .limit(1)
            .pipe(
              Effect.flatMap(Arr.head),
              Effect.tapError(Effect.logError),
              Effect.map((result): PlayerWithContactInfo | null => {
                if (!result || result.publicPlayerId === null) {
                  return null;
                }
                return result as PlayerWithContactInfo;
              })
            ),
      } as const;
    }),
    dependencies: [DatabaseLive],
  }
) {}
