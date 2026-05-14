/**
 * Run with: infisical run --env=dev -- bun packages/pipeline/src/pll/introspect.ts --slug=2024_game_1
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Config, Console, Effect, Redacted } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import { fetchJson } from "../http";

const EVENT_QUERY = `
query($slug: ID!) {
  event(slug: $slug) {
    id
    homeTeam { officialId fullName location locationCode urlLogo }
    awayTeam { officialId fullName location locationCode urlLogo }
    homeScore
    visitorScore
    eventStatus
    period
    playLogs {
      id
      period
      minutes
      seconds
      teamId
      gbPlayerName
      description
    }
  }
}
`;

const slugOption = Flag.string("slug").pipe(
  Flag.withDescription("PLL event slug to fetch"),
  Flag.withDefault("2024_game_1"),
);

const program = Effect.gen(function* () {
  const token = yield* Config.redacted("PLL_GRAPHQL_TOKEN");

  const command = Command.make(
    "pll-introspect",
    { slug: slugOption },
    ({ slug }) =>
      Effect.gen(function* () {
        yield* Console.log(`Fetching event: ${slug}\n`);

        const result = yield* fetchJson({
          url: "https://api.stats.premierlacrosseleague.com/graphql",
          timeoutMs: 30_000,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Redacted.value(token)}`,
            Origin: "https://stats.premierlacrosseleague.com",
            Referer: "https://stats.premierlacrosseleague.com/",
          },
          body: JSON.stringify({ query: EVENT_QUERY, variables: { slug } }),
          timeoutMessage: `Timed out fetching event ${slug}`,
          networkMessage: (error) => `Fetch failed: ${String(error)}`,
          httpMessage: (statusCode, statusText) =>
            `HTTP ${statusCode}: ${statusText}`,
          rateLimitMessage: "Rate limited by PLL GraphQL API",
          jsonParseMessage: (error) =>
            `Failed to parse response JSON: ${String(error)}`,
        });

        yield* Console.log(JSON.stringify(result, null, 2));
      }),
  );

  return yield* Command.run(command, { version: "1.0.0" });
});

BunRuntime.runMain(program.pipe(Effect.provide(BunServices.layer)));
