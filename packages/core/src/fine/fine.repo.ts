import {
  DrizzleService,
  headOrFail,
  query,
} from "@laxdb/core/drizzle/drizzle.service";
import { and, desc, eq, getColumns, lte } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { nanoid } from "nanoid";

import { members, users } from "../auth/auth.sql";

import type {
  AdjustFineInput,
  ApplyFineDoublingsInput,
  CreateFineTemplateInput,
  DeleteFineTemplateInput,
  FineActionInput,
  FineByIdInput,
  IssueFineInput,
  ListAuditInput,
  MemberFinesInput,
  OrganizationScopedInput,
  UpdateFineTemplateInput,
  FineEventKind,
} from "./fine.schema";
import { fineEvents, fines, fineTemplates } from "./fine.sql";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export class FineRepo extends Context.Service<FineRepo>()("FineRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    const fineColumns = getColumns(fines);
    const templateColumns = getColumns(fineTemplates);
    const eventColumns = getColumns(fineEvents);

    const getFine = (input: FineByIdInput) =>
      query(
        db
          .select(fineColumns)
          .from(fines)
          .where(
            and(
              eq(fines.organizationId, input.organizationId),
              eq(fines.id, input.id),
            ),
          ),
      ).pipe(Effect.flatMap(headOrFail));

    const makeEvent = (input: {
      readonly fineId: string;
      readonly kind: FineEventKind;
      readonly amountCents: number;
      readonly deltaCents: number;
      readonly actorUserId?: string | null | undefined;
      readonly note?: string | null | undefined;
      readonly at?: Date | undefined;
    }) => ({
      id: nanoid(),
      fineId: input.fineId,
      kind: input.kind,
      amountCents: input.amountCents,
      deltaCents: input.deltaCents,
      actorUserId: input.actorUserId ?? null,
      note: input.note ?? null,
      at: input.at ?? new Date(),
    });

    return {
      list: (input: OrganizationScopedInput) =>
        query(
          db
            .select(fineColumns)
            .from(fines)
            .where(eq(fines.organizationId, input.organizationId))
            .orderBy(desc(fines.issuedAt)),
        ),

      listForMember: (input: MemberFinesInput) =>
        query(
          db
            .select(fineColumns)
            .from(fines)
            .where(
              and(
                eq(fines.organizationId, input.organizationId),
                eq(fines.memberId, input.memberId),
              ),
            )
            .orderBy(desc(fines.issuedAt)),
        ),

      get: getFine,

      listTemplates: (input: OrganizationScopedInput) =>
        query(
          db
            .select(templateColumns)
            .from(fineTemplates)
            .where(eq(fineTemplates.organizationId, input.organizationId)),
        ),

      createTemplate: (input: CreateFineTemplateInput) =>
        query(
          db
            .insert(fineTemplates)
            .values({
              id: nanoid(),
              organizationId: input.organizationId,
              label: input.label,
              amountCents: input.amountCents,
              createdAt: new Date(),
            })
            .returning(templateColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      updateTemplate: (input: UpdateFineTemplateInput) =>
        query(
          db
            .update(fineTemplates)
            .set({
              ...(input.label !== undefined && { label: input.label }),
              ...(input.amountCents !== undefined && {
                amountCents: input.amountCents,
              }),
            })
            .where(
              and(
                eq(fineTemplates.organizationId, input.organizationId),
                eq(fineTemplates.id, input.id),
              ),
            )
            .returning(templateColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      deleteTemplate: (input: DeleteFineTemplateInput) =>
        query(
          db
            .delete(fineTemplates)
            .where(
              and(
                eq(fineTemplates.organizationId, input.organizationId),
                eq(fineTemplates.id, input.id),
              ),
            )
            .returning(templateColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      listMembers: (input: OrganizationScopedInput) =>
        query(
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
            .where(eq(members.organizationId, input.organizationId)),
        ),

      issue: (input: IssueFineInput) =>
        Effect.gen(function* () {
          yield* query(
            db
              .select({ id: members.id })
              .from(members)
              .where(
                and(
                  eq(members.organizationId, input.organizationId),
                  eq(members.id, input.memberId),
                ),
              ),
          ).pipe(Effect.flatMap(headOrFail));

          const template =
            input.templateId === undefined || input.templateId === null
              ? null
              : yield* query(
                  db
                    .select(templateColumns)
                    .from(fineTemplates)
                    .where(
                      and(
                        eq(fineTemplates.organizationId, input.organizationId),
                        eq(fineTemplates.id, input.templateId),
                      ),
                    ),
                ).pipe(Effect.flatMap(headOrFail));

          const reason = input.reason ?? template?.label ?? null;
          const amountCents =
            input.amountCents ?? template?.amountCents ?? null;

          if (reason === null || amountCents === null) {
            return yield* Effect.die("missing fine amount");
          }

          const issuedAt = new Date();
          const dueAt = input.dueAt ?? new Date(issuedAt.getTime() + WEEK_MS);
          const fine = yield* query(
            db
              .insert(fines)
              .values({
                id: nanoid(),
                organizationId: input.organizationId,
                memberId: input.memberId,
                templateId: input.templateId ?? null,
                reason,
                originalAmountCents: amountCents,
                amountCents,
                status: "unpaid",
                issuedAt,
                dueAt,
                paidAt: null,
                issuedByUserId: input.issuedByUserId ?? null,
              })
              .returning(fineColumns),
          ).pipe(Effect.flatMap(headOrFail));

          yield* query(
            db.insert(fineEvents).values(
              makeEvent({
                fineId: fine.id,
                kind: "issued",
                amountCents,
                deltaCents: amountCents,
                actorUserId: input.issuedByUserId,
                at: issuedAt,
              }),
            ),
          );

          return fine;
        }),

      pay: (input: FineActionInput) =>
        Effect.gen(function* () {
          const fine = yield* getFine(input);
          if (fine.status !== "unpaid") return fine;
          const now = new Date();
          const updated = yield* query(
            db
              .update(fines)
              .set({ status: "paid", paidAt: now })
              .where(
                and(
                  eq(fines.organizationId, input.organizationId),
                  eq(fines.id, input.id),
                ),
              )
              .returning(fineColumns),
          ).pipe(Effect.flatMap(headOrFail));
          yield* query(
            db.insert(fineEvents).values(
              makeEvent({
                fineId: input.id,
                kind: "paid",
                amountCents: fine.amountCents,
                deltaCents: -fine.amountCents,
                actorUserId: input.actorUserId,
                at: now,
              }),
            ),
          );
          return updated;
        }),

      forgive: (input: FineActionInput) =>
        Effect.gen(function* () {
          const fine = yield* getFine(input);
          if (fine.status !== "unpaid") return fine;
          const updated = yield* query(
            db
              .update(fines)
              .set({ status: "forgiven" })
              .where(
                and(
                  eq(fines.organizationId, input.organizationId),
                  eq(fines.id, input.id),
                ),
              )
              .returning(fineColumns),
          ).pipe(Effect.flatMap(headOrFail));
          yield* query(
            db.insert(fineEvents).values(
              makeEvent({
                fineId: input.id,
                kind: "forgiven",
                amountCents: fine.amountCents,
                deltaCents: -fine.amountCents,
                actorUserId: input.actorUserId,
                note: input.note,
              }),
            ),
          );
          return updated;
        }),

      adjust: (input: AdjustFineInput) =>
        Effect.gen(function* () {
          const fine = yield* getFine(input);
          const updated = yield* query(
            db
              .update(fines)
              .set({ amountCents: input.amountCents })
              .where(
                and(
                  eq(fines.organizationId, input.organizationId),
                  eq(fines.id, input.id),
                ),
              )
              .returning(fineColumns),
          ).pipe(Effect.flatMap(headOrFail));
          yield* query(
            db.insert(fineEvents).values(
              makeEvent({
                fineId: input.id,
                kind: "adjusted",
                amountCents: input.amountCents,
                deltaCents: input.amountCents - fine.amountCents,
                actorUserId: input.actorUserId,
                note: input.note,
              }),
            ),
          );
          return updated;
        }),

      listEvents: (input: FineByIdInput) =>
        Effect.gen(function* () {
          yield* getFine(input);
          return yield* query(
            db
              .select(eventColumns)
              .from(fineEvents)
              .where(eq(fineEvents.fineId, input.id))
              .orderBy(desc(fineEvents.at)),
          );
        }),

      listAudit: (input: ListAuditInput) =>
        query(
          db
            .select({ event: eventColumns, fine: fineColumns })
            .from(fineEvents)
            .innerJoin(fines, eq(fineEvents.fineId, fines.id))
            .where(eq(fines.organizationId, input.organizationId))
            .orderBy(desc(fineEvents.at))
            .limit(input.limit ?? 100),
        ),

      applyDoublings: (input: ApplyFineDoublingsInput) =>
        Effect.gen(function* () {
          const now = input.now ?? new Date();
          const due = yield* query(
            db
              .select(fineColumns)
              .from(fines)
              .where(and(eq(fines.status, "unpaid"), lte(fines.dueAt, now))),
          );

          if (due.length === 0) return { doubled: 0 };

          yield* Effect.forEach(due, (fine) => {
            const amountCents = fine.amountCents * 2;
            const dueAt = new Date(now.getTime() + WEEK_MS);
            return Effect.all([
              query(
                db
                  .update(fines)
                  .set({ amountCents, dueAt })
                  .where(eq(fines.id, fine.id)),
              ),
              query(
                db.insert(fineEvents).values(
                  makeEvent({
                    fineId: fine.id,
                    kind: "doubled",
                    amountCents,
                    deltaCents: amountCents - fine.amountCents,
                    at: now,
                  }),
                ),
              ),
            ]);
          });

          return { doubled: due.length };
        }),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
