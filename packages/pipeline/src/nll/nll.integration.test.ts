import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { NLLClient } from "./nll.client";

describe("NLLClient", () => {
  describe("getTeams", () => {
    it("fetches teams for season 225", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getTeams({ seasonId: 225 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty("id");
      expect(teams[0]).toHaveProperty("code");
      expect(teams[0]).toHaveProperty("name");
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getTeams({ seasonId: 225 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams[0]).toBeDefined();
      expect(teams[0]?.id).toBeTypeOf("string");
      expect(teams[0]?.code).toBeTypeOf("string");
    });
  });
});
