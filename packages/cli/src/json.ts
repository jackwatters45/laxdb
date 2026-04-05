import { Effect } from "effect";

export const parseJsonValue = (value: string, flagName: string) =>
  Effect.try({
    try: (): unknown => JSON.parse(value),
    catch: (error: unknown) =>
      new Error(`Failed to parse ${flagName} JSON: ${String(error)}`),
  });
