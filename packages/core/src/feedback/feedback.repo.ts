import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { getTableColumns } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";

import { DatabaseLive } from "../drizzle/drizzle.service";

import type { CreateFeedbackInput } from "./feedback.schema";
import { type FeedbackRow, feedbackTable } from "./feedback.sql";

export class FeedbackRepo extends Effect.Service<FeedbackRepo>()(
  "FeedbackRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _, ...rest } = getTableColumns(feedbackTable);

      return {
        insert: (input: CreateFeedbackInput) =>
          Effect.gen(function* () {
            const row: FeedbackRow = yield* db
              .insert(feedbackTable)
              .values([
                {
                  feedback: input.feedback,
                  source: input.source,
                  attachments: input.attachments ? [...input.attachments] : [],
                  userId: input.userId ?? null,
                  userEmail: input.userEmail ?? null,
                },
              ])
              .returning(rest)
              .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

            return row;
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
