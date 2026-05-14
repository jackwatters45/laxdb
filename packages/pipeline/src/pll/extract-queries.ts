/**
 * Extract GraphQL queries from the PLL stats website.
 * Run: bun packages/pipeline/src/pll/extract-queries.ts
 */

import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";

import { fetchText } from "../http";

const PLL_STATS_URL = "https://stats.premierlacrosseleague.com";
const REQUEST_TIMEOUT_MS = 30_000;

const fetchPllText = (url: string) =>
  fetchText({
    url,
    timeoutMs: REQUEST_TIMEOUT_MS,
    timeoutMessage: `Timed out fetching ${url}`,
    networkMessage: (error) =>
      `Network error fetching ${url}: ${String(error)}`,
    httpMessage: (statusCode) => `HTTP ${statusCode} fetching ${url}`,
    bodyReadMessage: (error) =>
      `Failed to read response body from ${url}: ${String(error)}`,
  });

const program = Effect.gen(function* () {
  const html = yield* fetchPllText(PLL_STATS_URL);

  const jsMatch = html.match(/src="(\/static\/js\/main\.[^"]+\.js)"/);
  if (!jsMatch) {
    yield* Console.error("Could not find main JS bundle");
    return;
  }

  const jsUrl = `${PLL_STATS_URL}${jsMatch[1]}`;
  yield* Console.log(`Fetching: ${jsUrl}\n`);

  const js = yield* fetchPllText(jsUrl);

  const queryPattern = /"\\nquery\(\$[^"]+"/g;
  const matches = js.match(queryPattern) ?? [];

  yield* Console.log(`Found ${matches.length} queries:\n`);

  const seen = new Set<string>();
  for (const match of matches) {
    const clean = match.replaceAll(/^"|"$/g, "").replaceAll("\\n", "\n").trim();

    const opMatch = clean.match(/\{\s*(\w+)/);
    const opName = opMatch?.[1] ?? "unknown";

    if (seen.has(opName)) continue;
    seen.add(opName);

    const varsMatch = clean.match(/query\(([^)]+)\)/);
    const vars = varsMatch?.[1] ?? "";

    yield* Console.log(`=== ${opName} ===`);
    yield* Console.log(`Variables: ${vars}`);
    yield* Console.log(`${clean.slice(0, 600)}...\n`);
  }
});

BunRuntime.runMain(program);
