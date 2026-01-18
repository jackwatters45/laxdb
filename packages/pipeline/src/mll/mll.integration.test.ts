import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { MLLClient } from "./mll.client";

describe("MLLClient", () => {
  describe("getTeams", () => {
    it("fetches teams for year 2006", async () => {
      const program = Effect.gen(function* () {
        const mll = yield* MLLClient;
        return yield* mll.getTeams({ year: 2006 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(MLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty("id");
      expect(teams[0]).toHaveProperty("name");
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const mll = yield* MLLClient;
        return yield* mll.getTeams({ year: 2006 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(MLLClient.Default)),
      );

      expect(teams[0]).toBeDefined();
      expect(teams[0]?.id).toBeTypeOf("string");
      expect(teams[0]?.name).toBeTypeOf("string");
    });

    it("fetches teams for year 2019", async () => {
      const program = Effect.gen(function* () {
        const mll = yield* MLLClient;
        return yield* mll.getTeams({ year: 2019 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(MLLClient.Default)),
      );

      expect(teams.length).toBe(6);
      expect(teams[0]).toHaveProperty("id");
      expect(teams[0]).toHaveProperty("name");
    });
  });
});
