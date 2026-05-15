import { describe, expect, it } from "@effect/vitest";
import { DrizzleService, query } from "@laxdb/core/drizzle/drizzle.service";
import { Effect, Layer } from "effect";

import { members, organizations, users } from "../auth/auth.sql";
import { TestDatabaseLive, truncateAll } from "../test/db";
import { makeTestRunner } from "../test/effect";

import { FineRepo } from "./fine.repo";
import { FineService } from "./fine.service";

const ServiceLayer = Layer.effect(FineService, FineService.make).pipe(
  Layer.provide(Layer.effect(FineRepo, FineRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

const run = makeTestRunner(TestLayer);

const ORG_ID = "org-fines";
const OTHER_ORG_ID = "org-other";
const USER_ID = "user-fines";
const OTHER_USER_ID = "user-other";
const MEMBER_ID = "member-fines";
const OTHER_MEMBER_ID = "member-other";

const seedFineMember = Effect.gen(function* () {
  const db = yield* DrizzleService;

  yield* query(
    db.insert(users).values([
      {
        id: USER_ID,
        name: "Fine Runner",
        email: "fine-runner@example.com",
        emailVerified: true,
      },
      {
        id: OTHER_USER_ID,
        name: "Other Runner",
        email: "other-runner@example.com",
        emailVerified: true,
      },
    ]),
  );
  yield* query(
    db.insert(organizations).values([
      { id: ORG_ID, name: "Fines Club", slug: "fines-club" },
      { id: OTHER_ORG_ID, name: "Other Club", slug: "other-club" },
    ]),
  );
  yield* query(
    db.insert(members).values([
      {
        id: MEMBER_ID,
        organizationId: ORG_ID,
        userId: USER_ID,
        role: "member",
      },
      {
        id: OTHER_MEMBER_ID,
        organizationId: OTHER_ORG_ID,
        userId: OTHER_USER_ID,
        role: "member",
      },
    ]),
  );
});

describe("FineService integration", () => {
  it("creates, updates, lists, and deletes fine templates within an organization", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;

        const template = yield* svc.createTemplate({
          organizationId: ORG_ID,
          label: "Late to practice",
          amountCents: 500,
        });
        const updated = yield* svc.updateTemplate({
          organizationId: ORG_ID,
          id: template.id,
          label: "Late arrival",
          amountCents: 750,
        });
        const templates = yield* svc.listTemplates({ organizationId: ORG_ID });
        const otherTemplates = yield* svc.listTemplates({
          organizationId: OTHER_ORG_ID,
        });

        expect(updated.label).toBe("Late arrival");
        expect(updated.amountCents).toBe(750);
        expect(templates.map((item) => item.id)).toEqual([template.id]);
        expect(otherTemplates).toHaveLength(0);

        const deleted = yield* svc.deleteTemplate({
          organizationId: ORG_ID,
          id: template.id,
        });
        const afterDelete = yield* svc.listTemplates({
          organizationId: ORG_ID,
        });

        expect(deleted.id).toBe(template.id);
        expect(afterDelete).toHaveLength(0);
      }),
    ));

  it("issues fines from templates and records the issued event", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;
        const template = yield* svc.createTemplate({
          organizationId: ORG_ID,
          label: "Forgot pennies",
          amountCents: 300,
        });

        const fine = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          issuedByUserId: USER_ID,
          templateId: template.id,
        });
        const events = yield* svc.listEvents({
          organizationId: ORG_ID,
          id: fine.id,
        });

        expect(fine.reason).toBe("Forgot pennies");
        expect(fine.amountCents).toBe(300);
        expect(fine.originalAmountCents).toBe(300);
        expect(fine.status).toBe("unpaid");
        expect(fine.templateId).toBe(template.id);
        expect(events).toHaveLength(1);
        expect(events[0]?.kind).toBe("issued");
        expect(events[0]?.deltaCents).toBe(300);
      }),
    ));

  it("issues manual fines and requires reason plus amount when no template is provided", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;

        const fine = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Missed lift",
          amountCents: 1_000,
        });
        const exit = yield* svc
          .issue({
            organizationId: ORG_ID,
            memberId: MEMBER_ID,
            reason: "No amount",
          })
          .pipe(Effect.exit);

        expect(fine.reason).toBe("Missed lift");
        expect(fine.amountCents).toBe(1_000);
        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure") {
          expect(exit.cause.toString()).toContain(
            "reason and amountCents required",
          );
        }
      }),
    ));

  it("pays, forgives, and adjusts fines with audit locality", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;
        const fine = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Gear left out",
          amountCents: 400,
        });
        const secondFine = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Missed cleanup",
          amountCents: 600,
        });

        const adjusted = yield* svc.adjust({
          organizationId: ORG_ID,
          id: fine.id,
          amountCents: 450,
          actorUserId: USER_ID,
          note: "Added processing fee",
        });
        const paid = yield* svc.pay({
          organizationId: ORG_ID,
          id: fine.id,
          actorUserId: USER_ID,
        });
        const forgiven = yield* svc.forgive({
          organizationId: ORG_ID,
          id: secondFine.id,
          actorUserId: USER_ID,
          note: "Coach override",
        });
        const events = yield* svc.listEvents({
          organizationId: ORG_ID,
          id: fine.id,
        });
        const audit = yield* svc.listAudit({
          organizationId: ORG_ID,
          limit: 10,
        });

        expect(adjusted.amountCents).toBe(450);
        expect(paid.status).toBe("paid");
        expect(paid.paidAt).toBeInstanceOf(Date);
        expect(forgiven.status).toBe("forgiven");
        expect(events.map((event) => event.kind)).toContain("adjusted");
        expect(events.map((event) => event.kind)).toContain("paid");
        expect(audit).toHaveLength(5);
        expect(
          audit.every((entry) => entry.fine.organizationId === ORG_ID),
        ).toBe(true);
      }),
    ));

  it("lists member fines and members only for the requested organization", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;

        yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Club fine",
          amountCents: 200,
        });
        yield* svc.issue({
          organizationId: OTHER_ORG_ID,
          memberId: OTHER_MEMBER_ID,
          reason: "Other club fine",
          amountCents: 300,
        });

        const membersForOrg = yield* svc.listMembers({
          organizationId: ORG_ID,
        });
        const memberFines = yield* svc.listForMember({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
        });
        const orgFines = yield* svc.list({ organizationId: ORG_ID });

        expect(membersForOrg.map((member) => member.id)).toEqual([MEMBER_ID]);
        expect(memberFines.map((fine) => fine.reason)).toEqual(["Club fine"]);
        expect(orgFines.map((fine) => fine.organizationId)).toEqual([ORG_ID]);
      }),
    ));

  it("doubles overdue unpaid fines and leaves paid fines unchanged", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;
        const now = new Date("2026-05-15T00:00:00.000Z");
        const overdue = new Date("2026-05-01T00:00:00.000Z");
        const future = new Date("2026-05-20T00:00:00.000Z");
        const unpaid = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Overdue",
          amountCents: 250,
          dueAt: overdue,
        });
        const paid = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Paid overdue",
          amountCents: 350,
          dueAt: overdue,
        });
        const notDue = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Not due",
          amountCents: 450,
          dueAt: future,
        });
        yield* svc.pay({ organizationId: ORG_ID, id: paid.id });

        const result = yield* svc.applyDoublings({ now });
        const doubled = yield* svc.get({
          organizationId: ORG_ID,
          id: unpaid.id,
        });
        const stillPaid = yield* svc.get({
          organizationId: ORG_ID,
          id: paid.id,
        });
        const stillFuture = yield* svc.get({
          organizationId: ORG_ID,
          id: notDue.id,
        });
        const events = yield* svc.listEvents({
          organizationId: ORG_ID,
          id: unpaid.id,
        });

        expect(result.doubled).toBe(1);
        expect(doubled.amountCents).toBe(500);
        expect(stillPaid.amountCents).toBe(350);
        expect(stillFuture.amountCents).toBe(450);
        expect(events.map((event) => event.kind)).toContain("doubled");
      }),
    ));

  it("returns NotFoundError for fines outside the organization seam", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        yield* seedFineMember;
        const svc = yield* FineService;
        const fine = yield* svc.issue({
          organizationId: ORG_ID,
          memberId: MEMBER_ID,
          reason: "Scoped fine",
          amountCents: 200,
        });

        const exit = yield* svc
          .get({ organizationId: OTHER_ORG_ID, id: fine.id })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure") {
          expect(exit.cause.toString()).toContain("NotFoundError");
        }
      }),
    ));
});
