import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { ConstraintViolationError, DatabaseError } from "../error";
import { decodeArguments, parsePostgresError } from "../util";

const makeError = (code?: string, constraint?: string, detail?: string) => ({
  cause: { code, constraint, detail, message: `pg error ${code}` },
  message: "SqlError",
});

// ---------------------------------------------------------------------------
// parsePostgresError
// ---------------------------------------------------------------------------

describe("parsePostgresError", () => {
  describe("constraint violations (23xxx)", () => {
    it("23505 unique violation → ConstraintViolationError", () => {
      const result = parsePostgresError(
        makeError("23505", "player_public_id_unique"),
      );
      expect(result).toBeInstanceOf(ConstraintViolationError);
      expect(result.pgCode).toBe("23505");
      if (result instanceof ConstraintViolationError) {
        expect(result.constraint).toBe("player_public_id_unique");
      }
    });

    it("23503 FK violation → ConstraintViolationError", () => {
      const result = parsePostgresError(makeError("23503", "fk_drill"));
      expect(result).toBeInstanceOf(ConstraintViolationError);
      expect(result.pgCode).toBe("23503");
      if (result instanceof ConstraintViolationError) {
        expect(result.constraint).toBe("fk_drill");
      }
    });

    it("23502 not-null violation → ConstraintViolationError", () => {
      const result = parsePostgresError(makeError("23502"));
      expect(result).toBeInstanceOf(ConstraintViolationError);
      expect(result.pgCode).toBe("23502");
      if (result instanceof ConstraintViolationError) {
        expect(result.detail).toBe("Not null constraint violation");
      }
    });

    it("23514 check constraint → ConstraintViolationError", () => {
      const result = parsePostgresError(makeError("23514", "chk_positive"));
      expect(result).toBeInstanceOf(ConstraintViolationError);
      expect(result.pgCode).toBe("23514");
    });

    it("missing constraint name defaults to 'unknown'", () => {
      const result = parsePostgresError(makeError("23505"));
      expect(result).toBeInstanceOf(ConstraintViolationError);
      if (result instanceof ConstraintViolationError) {
        expect(result.constraint).toBe("unknown");
      }
    });

    it("preserves detail when provided", () => {
      const result = parsePostgresError(
        makeError("23505", "uq", "Key (email)=(a@b.com) already exists."),
      );
      expect(result).toBeInstanceOf(ConstraintViolationError);
      if (result instanceof ConstraintViolationError) {
        expect(result.detail).toBe("Key (email)=(a@b.com) already exists.");
      }
    });
  });

  describe("privilege errors", () => {
    it("42501 → DatabaseError with privilege message", () => {
      const result = parsePostgresError(makeError("42501"));
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe("Insufficient database privileges");
    });
  });

  describe("connection errors", () => {
    for (const code of ["08000", "08003", "08006", "53300"]) {
      it(`${code} → DatabaseError with connection message`, () => {
        const result = parsePostgresError(makeError(code));
        expect(result).toBeInstanceOf(DatabaseError);
        expect(result.message).toBe("Database connection error");
      });
    }
  });

  describe("transaction conflicts", () => {
    for (const code of ["40001", "40P01"]) {
      it(`${code} → DatabaseError with retry message`, () => {
        const result = parsePostgresError(makeError(code));
        expect(result).toBeInstanceOf(DatabaseError);
        expect(result.message).toBe("Transaction conflict - please retry");
      });
    }
  });

  describe("unknown/missing codes", () => {
    it("unknown code → DatabaseError with pg message", () => {
      const result = parsePostgresError(makeError("99999"));
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.pgCode).toBe("99999");
      expect(result.message).toBe("pg error 99999");
    });

    it("no code → DatabaseError with default message", () => {
      const result = parsePostgresError({
        cause: {},
        message: "SqlError",
      });
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe("Unknown database error");
    });

    it("undefined cause → DatabaseError", () => {
      const result = parsePostgresError({ message: "SqlError" });
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe("Unknown database error");
    });
  });
});

// ---------------------------------------------------------------------------
// decodeArguments
// ---------------------------------------------------------------------------

describe("decodeArguments", () => {
  const TestInput = Schema.Struct({
    name: Schema.String.check(Schema.isMinLength(1)),
  });

  it("returns decoded value for valid input", async () => {
    const result = await Effect.runPromise(
      decodeArguments(TestInput, { name: "hello" }),
    );
    expect(result.name).toBe("hello");
  });

  it("fails with ValidationError for invalid input", async () => {
    const exit = await Effect.runPromiseExit(
      decodeArguments(TestInput, { name: "" }),
    );
    expect(exit._tag).toBe("Failure");
  });
});
