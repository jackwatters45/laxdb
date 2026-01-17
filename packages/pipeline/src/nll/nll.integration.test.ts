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
    });
  });
});
