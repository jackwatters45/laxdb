import { and, desc, eq, lte } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";

import { members, users } from "../auth/auth.sql.ts";
import { Db } from "../db.ts";

import { fines, type Fine } from "./fine.sql.ts";
import {
  fineEvents,
  type FineEvent,
  type FineEventKind,
} from "./fineEvent.sql.ts";
import { fineTemplates } from "./fineTemplate.sql.ts";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const makeEvent = (input: {
  fineId: string;
  kind: FineEventKind;
  amountCents: number;
  deltaCents: number;
  actorUserId?: string | null | undefined;
  note?: string | null | undefined;
  at?: Date | undefined;
}): FineEvent => ({
  id: nanoid(),
  fineId: input.fineId,
  kind: input.kind,
  amountCents: input.amountCents,
  deltaCents: input.deltaCents,
  actorUserId: input.actorUserId ?? null,
  note: input.note ?? null,
  at: input.at ?? new Date(),
});

export const list = (organizationId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select()
        .from(fines)
        .where(eq(fines.organizationId, organizationId))
        .orderBy(desc(fines.issuedAt))
        .all(),
    );
  });

export const listForMember = (memberId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select()
        .from(fines)
        .where(eq(fines.memberId, memberId))
        .orderBy(desc(fines.issuedAt))
        .all(),
    );
  });

export const get = (id: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db.select().from(fines).where(eq(fines.id, id)).get(),
    );
  });

export const issue = (input: {
  organizationId: string;
  memberId: string;
  templateId?: string | null | undefined;
  reason?: string | null | undefined;
  amountCents?: number | undefined;
  issuedByUserId?: string | null | undefined;
  dueAt?: Date | undefined;
}) =>
  Effect.gen(function* () {
    const db = yield* Db;

    let reason = input.reason ?? null;
    let amountCents = input.amountCents ?? null;

    const templateId = input.templateId;
    if (templateId) {
      const tpl = yield* Effect.tryPromise(() =>
        db
          .select()
          .from(fineTemplates)
          .where(eq(fineTemplates.id, templateId))
          .get(),
      );
      if (!tpl) return yield* Effect.fail(new Error("template not found"));
      reason = reason ?? tpl.label;
      amountCents = amountCents ?? tpl.amountCents;
    }

    if (reason === null || amountCents === null) {
      return yield* Effect.fail(
        new Error("reason and amountCents required when no template"),
      );
    }

    const issuedAt = new Date();
    const row: Fine = {
      id: nanoid(),
      organizationId: input.organizationId,
      memberId: input.memberId,
      templateId: input.templateId ?? null,
      reason,
      originalAmountCents: amountCents,
      amountCents,
      status: "unpaid",
      issuedAt,
      dueAt: input.dueAt ?? new Date(issuedAt.getTime() + WEEK_MS),
      paidAt: null,
      issuedByUserId: input.issuedByUserId ?? null,
    };

    const event = makeEvent({
      fineId: row.id,
      kind: "issued",
      amountCents,
      deltaCents: amountCents,
      actorUserId: input.issuedByUserId,
      at: issuedAt,
    });

    yield* Effect.tryPromise(async () => {
      await db.insert(fines).values(row).run();
      await db.insert(fineEvents).values(event).run();
    });

    return row;
  });

export const pay = (id: string, actorUserId?: string | null) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const fine = yield* Effect.tryPromise(() =>
      db.select().from(fines).where(eq(fines.id, id)).get(),
    );
    if (!fine) return yield* Effect.fail(new Error("fine not found"));
    if (fine.status !== "unpaid") return fine;

    const now = new Date();
    const event = makeEvent({
      fineId: id,
      kind: "paid",
      amountCents: fine.amountCents,
      deltaCents: -fine.amountCents,
      actorUserId,
      at: now,
    });

    yield* Effect.tryPromise(async () => {
      await db
        .update(fines)
        .set({ status: "paid", paidAt: now })
        .where(eq(fines.id, id))
        .run();
      await db.insert(fineEvents).values(event).run();
    });

    const updated: Fine = { ...fine, status: "paid", paidAt: now };
    return updated;
  });

export const forgive = (
  id: string,
  actorUserId?: string | null,
  note?: string | null,
) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const fine = yield* Effect.tryPromise(() =>
      db.select().from(fines).where(eq(fines.id, id)).get(),
    );
    if (!fine) return yield* Effect.fail(new Error("fine not found"));
    if (fine.status !== "unpaid") return fine;

    const event = makeEvent({
      fineId: id,
      kind: "forgiven",
      amountCents: fine.amountCents,
      deltaCents: -fine.amountCents,
      actorUserId,
      note,
    });

    yield* Effect.tryPromise(async () => {
      await db
        .update(fines)
        .set({ status: "forgiven" })
        .where(eq(fines.id, id))
        .run();
      await db.insert(fineEvents).values(event).run();
    });

    const updated: Fine = { ...fine, status: "forgiven" };
    return updated;
  });

export const adjust = (
  id: string,
  newAmountCents: number,
  actorUserId?: string | null,
  note?: string | null,
) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const fine = yield* Effect.tryPromise(() =>
      db.select().from(fines).where(eq(fines.id, id)).get(),
    );
    if (!fine) return yield* Effect.fail(new Error("fine not found"));

    const event = makeEvent({
      fineId: id,
      kind: "adjusted",
      amountCents: newAmountCents,
      deltaCents: newAmountCents - fine.amountCents,
      actorUserId,
      note,
    });

    yield* Effect.tryPromise(async () => {
      await db
        .update(fines)
        .set({ amountCents: newAmountCents })
        .where(eq(fines.id, id))
        .run();
      await db.insert(fineEvents).values(event).run();
    });
    return { ...fine, amountCents: newAmountCents };
  });

export const listEvents = (fineId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select()
        .from(fineEvents)
        .where(eq(fineEvents.fineId, fineId))
        .orderBy(desc(fineEvents.at))
        .all(),
    );
  });

export const listOrgAudit = (organizationId: string, limit = 100) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select({
          event: fineEvents,
          fine: fines,
        })
        .from(fineEvents)
        .innerJoin(fines, eq(fineEvents.fineId, fines.id))
        .where(eq(fines.organizationId, organizationId))
        .orderBy(desc(fineEvents.at))
        .limit(limit)
        .all(),
    );
  });

export const listOrgMembers = (organizationId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    return yield* Effect.tryPromise(() =>
      db
        .select({
          id: members.id,
          userId: members.userId,
          role: members.role,
          name: users.name,
          email: users.email,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(eq(members.organizationId, organizationId))
        .all(),
    );
  });

export const applyDoublings = (now: Date = new Date()) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const due = yield* Effect.tryPromise(() =>
      db
        .select()
        .from(fines)
        .where(and(eq(fines.status, "unpaid"), lte(fines.dueAt, now)))
        .all(),
    );

    if (due.length === 0) return { doubled: 0 };

    yield* Effect.tryPromise(() =>
      Promise.all(
        due.flatMap((fine) => {
          const newAmount = fine.amountCents * 2;
          const newDue = new Date(now.getTime() + WEEK_MS);
          return [
            db
              .update(fines)
              .set({ amountCents: newAmount, dueAt: newDue })
              .where(eq(fines.id, fine.id))
              .run(),
            db
              .insert(fineEvents)
              .values(
                makeEvent({
                  fineId: fine.id,
                  kind: "doubled",
                  amountCents: newAmount,
                  deltaCents: newAmount - fine.amountCents,
                  at: now,
                }),
              )
              .run(),
          ];
        }),
      ),
    );

    return { doubled: due.length };
  });
