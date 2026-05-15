import { NotFoundError, ValidationError } from "@laxdb/core/error";
import {
  decodeArguments,
  parseSqlError,
  type SchemaInput,
} from "@laxdb/core/util";
import { Context, Effect, Layer } from "effect";

import { FineRepo } from "./fine.repo";
import {
  AdjustFineInput,
  ApplyFineDoublingsInput,
  ApplyFineDoublingsResult,
  CreateFineTemplateInput,
  DeleteFineTemplateInput,
  Fine,
  FineActionInput,
  FineAuditEntry,
  FineByIdInput,
  FineEvent,
  FineMember,
  FineTemplate,
  IssueFineInput,
  ListAuditInput,
  MemberFinesInput,
  OrganizationScopedInput,
  UpdateFineTemplateInput,
} from "./fine.schema";

const asFine = (row: typeof Fine.Type) => new Fine(row);
const asFineTemplate = (row: typeof FineTemplate.Type) => new FineTemplate(row);
const asFineEvent = (row: typeof FineEvent.Type) => new FineEvent(row);
const asFineMember = (row: typeof FineMember.Type) => new FineMember(row);
const asFineAuditEntry = (row: typeof FineAuditEntry.Type) =>
  new FineAuditEntry({ event: asFineEvent(row.event), fine: asFine(row.fine) });
const asDoublingResult = (row: typeof ApplyFineDoublingsResult.Type) =>
  new ApplyFineDoublingsResult(row);

const notFound = (domain: string, id: string | number) =>
  new NotFoundError({ domain, id });

const issueInputHasAmount = (input: typeof IssueFineInput.Type) =>
  input.templateId !== undefined && input.templateId !== null
    ? true
    : input.reason !== undefined &&
      input.reason !== null &&
      input.amountCents !== undefined;

export class FineService extends Context.Service<FineService>()("FineService", {
  make: Effect.gen(function* () {
    const repo = yield* FineRepo;

    return {
      list: (input: SchemaInput<typeof OrganizationScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            OrganizationScopedInput,
            input,
          );
          return yield* repo.list(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFine)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to list fines", e)),
        ),

      listForMember: (input: SchemaInput<typeof MemberFinesInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(MemberFinesInput, input);
          return yield* repo.listForMember(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFine)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list member fines", e),
          ),
        ),

      get: (input: SchemaInput<typeof FineByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(FineByIdInput, input);
          return yield* repo.get(decoded);
        }).pipe(
          Effect.map(asFine),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Fine", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to get fine", e)),
        ),

      listTemplates: (input: SchemaInput<typeof OrganizationScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            OrganizationScopedInput,
            input,
          );
          return yield* repo.listTemplates(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFineTemplate)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list fine templates", e),
          ),
        ),

      createTemplate: (input: SchemaInput<typeof CreateFineTemplateInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            CreateFineTemplateInput,
            input,
          );
          return yield* repo.createTemplate(decoded);
        }).pipe(
          Effect.map(asFineTemplate),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("FineTemplate", "create")),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to create fine template", e),
          ),
        ),

      updateTemplate: (input: SchemaInput<typeof UpdateFineTemplateInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            UpdateFineTemplateInput,
            input,
          );
          return yield* repo.updateTemplate(decoded);
        }).pipe(
          Effect.map(asFineTemplate),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("FineTemplate", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to update fine template", e),
          ),
        ),

      deleteTemplate: (input: SchemaInput<typeof DeleteFineTemplateInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            DeleteFineTemplateInput,
            input,
          );
          return yield* repo.deleteTemplate(decoded);
        }).pipe(
          Effect.map(asFineTemplate),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("FineTemplate", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to delete fine template", e),
          ),
        ),

      listMembers: (input: SchemaInput<typeof OrganizationScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            OrganizationScopedInput,
            input,
          );
          return yield* repo.listMembers(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFineMember)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list fine members", e),
          ),
        ),

      issue: (input: SchemaInput<typeof IssueFineInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(IssueFineInput, input);
          if (!issueInputHasAmount(decoded)) {
            return yield* Effect.fail(
              new ValidationError({
                domain: "Fine",
                message: "reason and amountCents required when no template",
              }),
            );
          }
          return yield* repo.issue(decoded);
        }).pipe(
          Effect.map(asFine),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("FineInput", "member-or-template")),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to issue fine", e)),
        ),

      pay: (input: SchemaInput<typeof FineActionInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(FineActionInput, input);
          return yield* repo.pay(decoded);
        }).pipe(
          Effect.map(asFine),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Fine", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to pay fine", e)),
        ),

      forgive: (input: SchemaInput<typeof FineActionInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(FineActionInput, input);
          return yield* repo.forgive(decoded);
        }).pipe(
          Effect.map(asFine),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Fine", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to forgive fine", e)),
        ),

      adjust: (input: SchemaInput<typeof AdjustFineInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(AdjustFineInput, input);
          return yield* repo.adjust(decoded);
        }).pipe(
          Effect.map(asFine),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Fine", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to adjust fine", e)),
        ),

      listEvents: (input: SchemaInput<typeof FineByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(FineByIdInput, input);
          return yield* repo.listEvents(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFineEvent)),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Fine", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list fine events", e),
          ),
        ),

      listAudit: (input: SchemaInput<typeof ListAuditInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(ListAuditInput, input);
          return yield* repo.listAudit(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asFineAuditEntry)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list fine audit", e),
          ),
        ),

      applyDoublings: (input: SchemaInput<typeof ApplyFineDoublingsInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            ApplyFineDoublingsInput,
            input,
          );
          return yield* repo.applyDoublings(decoded);
        }).pipe(
          Effect.map(asDoublingResult),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to apply fine doublings", e),
          ),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(FineRepo.layer),
  );
}
