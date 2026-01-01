import { Effect } from "effect";
import { PLLClient } from "./pll/pll.client";

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;

  yield* Effect.log("=== PLL API Test ===\n");

  yield* Effect.log("1. Testing REST API (standings)...");
  const standings = yield* pll.getStandings({ year: 2024 });

  yield* Effect.log(`   Found ${standings.length} teams:\n`);
  for (const team of standings.slice(0, 4)) {
    const diff =
      team.scoreDiff >= 0 ? `+${team.scoreDiff}` : `${team.scoreDiff}`;
    yield* Effect.log(
      `   - ${team.fullName.padEnd(12)} ${team.wins}-${team.losses} (${diff})`,
    );
  }
  yield* Effect.log("   ...\n");

  yield* Effect.log("2. Testing GraphQL API (players)...");
  const players = yield* pll.getPlayers({ season: 2025, limit: 10 });

  yield* Effect.log(`   Found ${players.length} players:\n`);
  for (const player of players.slice(0, 5)) {
    const team = player.allTeams.find((t: { year: number }) => t.year === 2025);
    const pos = team?.positionName ?? "?";
    const teamCode = team?.locationCode ?? "?";
    const goals = player.stats?.goals ?? 0;
    const assists = player.stats?.assists ?? 0;
    yield* Effect.log(
      `   - #${String(player.jerseyNum ?? "?").padStart(2)} ${player.firstName} ${player.lastName} (${teamCode}, ${pos}) - ${goals}G ${assists}A`,
    );
  }
  yield* Effect.log("   ...\n");

  yield* Effect.log("=== Both APIs working! ===");

  return { standings: standings.length, players: players.length };
});

try {
  const result = await Effect.runPromise(
    program.pipe(Effect.provide(PLLClient.Default)),
  );
  console.log(
    `\nSummary: ${result.standings} teams, ${result.players} players fetched`,
  );
} catch (error) {
  console.error("Failed:", error);
  process.exit(1);
}
