import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  Base64IdSchema,
  EmailSchema,
  JerseyNumberSchema,
  NanoidSchema,
  PlayerNameSchema,
  SerialSchema,
} from "../schema";

describe("NanoidSchema", () => {
  it("accepts valid 12-char nanoid", () => {
    expect(Schema.decodeUnknownSync(NanoidSchema)("AbCdEfGhIjKl")).toBe(
      "AbCdEfGhIjKl",
    );
  });

  it("accepts nanoid with underscores and hyphens", () => {
    expect(Schema.decodeUnknownSync(NanoidSchema)("Ab_d-fGhIjKl")).toBe(
      "Ab_d-fGhIjKl",
    );
  });

  it("rejects wrong length", () => {
    expect(() => Schema.decodeUnknownSync(NanoidSchema)("short")).toThrow();
  });
  it("rejects too long", () => {
    expect(() =>
      Schema.decodeUnknownSync(NanoidSchema)("AbCdEfGhIjKlX"),
    ).toThrow();
  });
  it("rejects invalid chars", () => {
    expect(() =>
      Schema.decodeUnknownSync(NanoidSchema)("AbCdEf!hIjKl"),
    ).toThrow();
  });
});

describe("SerialSchema", () => {
  it("accepts 0", () => {
    expect(Schema.decodeUnknownSync(SerialSchema)(0)).toBe(0);
  });
  it("accepts positive int", () => {
    expect(Schema.decodeUnknownSync(SerialSchema)(42)).toBe(42);
  });
  it("rejects negative", () => {
    expect(() => Schema.decodeUnknownSync(SerialSchema)(-1)).toThrow();
  });
  it("rejects float", () => {
    expect(() => Schema.decodeUnknownSync(SerialSchema)(1.5)).toThrow();
  });
});

describe("EmailSchema", () => {
  it("accepts valid email", () => {
    expect(Schema.decodeUnknownSync(EmailSchema)("test@example.com")).toBe(
      "test@example.com",
    );
  });
  it("rejects missing @", () => {
    expect(() => Schema.decodeUnknownSync(EmailSchema)("notanemail")).toThrow();
  });
  it("rejects missing domain", () => {
    expect(() => Schema.decodeUnknownSync(EmailSchema)("test@")).toThrow();
  });
});

describe("PlayerNameSchema", () => {
  it("accepts valid name", () => {
    expect(Schema.decodeUnknownSync(PlayerNameSchema)("John")).toBe("John");
  });
  it("rejects empty string", () => {
    expect(() => Schema.decodeUnknownSync(PlayerNameSchema)("")).toThrow();
  });
  it("rejects >100 chars", () => {
    expect(() =>
      Schema.decodeUnknownSync(PlayerNameSchema)("A".repeat(101)),
    ).toThrow();
  });
});

describe("JerseyNumberSchema", () => {
  it("accepts 0", () => {
    expect(Schema.decodeUnknownSync(JerseyNumberSchema)(0)).toBe(0);
  });
  it("accepts 999", () => {
    expect(Schema.decodeUnknownSync(JerseyNumberSchema)(999)).toBe(999);
  });
  it("accepts 1000", () => {
    expect(Schema.decodeUnknownSync(JerseyNumberSchema)(1000)).toBe(1000);
  });
  it("rejects negative", () => {
    expect(() => Schema.decodeUnknownSync(JerseyNumberSchema)(-1)).toThrow();
  });
  it("rejects >1000", () => {
    expect(() => Schema.decodeUnknownSync(JerseyNumberSchema)(1001)).toThrow();
  });
  it("rejects float", () => {
    expect(() => Schema.decodeUnknownSync(JerseyNumberSchema)(1.5)).toThrow();
  });
});

describe("Base64IdSchema", () => {
  it("accepts valid 32-char alphanumeric", () => {
    const id = "a".repeat(32);
    expect(Schema.decodeUnknownSync(Base64IdSchema())(id)).toBe(id);
  });
  it("rejects wrong length", () => {
    expect(() => Schema.decodeUnknownSync(Base64IdSchema())("short")).toThrow();
  });
  it("rejects special chars", () => {
    expect(() =>
      Schema.decodeUnknownSync(Base64IdSchema())("a".repeat(31) + "!"),
    ).toThrow();
  });
});
