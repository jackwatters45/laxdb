import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";

import { Db } from "../db.ts";

import { fineTemplates, type FineTemplate } from "./fineTemplate.sql.ts";

export const list = (organizationId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select()
        .from(fineTemplates)
        .where(eq(fineTemplates.organizationId, organizationId))
        .all(),
    );
  });

export const create = (input: {
  organizationId: string;
  label: string;
  amountCents: number;
}) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const row: FineTemplate = {
      id: nanoid(),
      organizationId: input.organizationId,
      label: input.label,
      amountCents: input.amountCents,
      createdAt: new Date(),
    };
    yield* Effect.tryPromise(() => db.insert(fineTemplates).values(row).run());
    return row;
  });

export const update = (
  id: string,
  patch: { label?: string; amountCents?: number },
) =>
  Effect.gen(function* () {
    const db = yield* Db;
    yield* Effect.tryPromise(() =>
      db.update(fineTemplates).set(patch).where(eq(fineTemplates.id, id)).run(),
    );
  });

export const remove = (id: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    yield* Effect.tryPromise(() =>
      db.delete(fineTemplates).where(eq(fineTemplates.id, id)).run(),
    );
  });
