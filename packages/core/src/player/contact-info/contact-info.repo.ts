import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq, getTableColumns } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";
import { DatabaseLive } from "../../drizzle/drizzle.service";
import { playerTable } from "../player.sql";
import type {
  GetPlayerContactInfoInput,
  PlayerWithContactInfo,
} from "./contact-info.schema";
import { playerContactInfoTable } from "./contact-info.sql";
import type { SqlError } from "@effect/sql/SqlError";
import type { NoSuchElementException } from "effect/Cause";

export class ContactInfoRepo extends Effect.Service<ContactInfoRepo>()(
  "ContactInfoRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _id, ...rest } = getTableColumns(playerContactInfoTable);

      return {
        getPlayerWithContactInfo: (
          input: GetPlayerContactInfoInput,
        ): Effect.Effect<
          PlayerWithContactInfo | null,
          SqlError | NoSuchElementException
        > =>
          db
            .select({
              ...rest,
              publicPlayerId: playerTable.publicId,
              name: playerTable.name,
            })
            .from(playerTable)
            .leftJoin(
              playerContactInfoTable,
              eq(playerTable.id, playerContactInfoTable.playerId),
            )
            .where(eq(playerTable.id, input.playerId))
            .limit(1)
            .pipe(
              Effect.flatMap(Arr.head),
              Effect.tapError(Effect.logError),
              Effect.map((result) => {
                if (!result) {
                  return null;
                }
                // TODO: The comment claims "same type" but the actual type narrowing logic is unclear. The check only verifies result exists, but doesn't validate that all required fields of PlayerWithContactInfo are present.
                // oxlint-disable-next-line no-unsafe-type-assertion - same type we just want inference for actual PlayerWithContactInfo
                return result as PlayerWithContactInfo;
              }),
            ),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
