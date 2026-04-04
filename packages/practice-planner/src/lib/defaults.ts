import { Schema } from "effect";

export const practiceDefaultsScope = {
  namespace: "practice",
  scopeId: "global",
  scopeType: "global" as const,
};

const PracticeDefaultsValues = Schema.Struct({
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  location: Schema.optional(Schema.NullOr(Schema.String)),
});

export function decodePracticeDefaults(values: Record<string, unknown>) {
  const decoded = Schema.decodeUnknownSync(PracticeDefaultsValues)(values);

  return {
    durationMinutes: decoded.durationMinutes ?? null,
    location: decoded.location ?? null,
  };
}
