import { Schema } from "effect";

// MLL (Major League Lacrosse) operated from 2001 to 2020
// The league merged with the PLL after the 2020 season
export const MLLYear = Schema.Number.pipe(
  Schema.int(),
  Schema.between(2001, 2020),
  Schema.brand("MLLYear"),
  Schema.annotations({
    description: "MLL season year (2001-2020)",
  }),
);
export type MLLYear = typeof MLLYear.Type;

// MLL Team response schema
export class MLLTeam extends Schema.Class<MLLTeam>("MLLTeam")({
  id: Schema.String,
  name: Schema.String,
  city: Schema.NullOr(Schema.String),
  abbreviation: Schema.NullOr(Schema.String),
  founded_year: Schema.NullOr(Schema.Number),
  final_year: Schema.NullOr(Schema.Number),
}) {}
