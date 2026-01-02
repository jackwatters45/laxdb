/**
 * Extract GraphQL queries from the PLL stats website.
 * Run: bun packages/pipeline/src/pll/extract-queries.ts
 */

const PLL_STATS_URL = "https://stats.premierlacrosseleague.com";

async function extractQueries() {
  const html = await fetch(PLL_STATS_URL).then((r) => r.text());

  const jsMatch = html.match(/src="(\/static\/js\/main\.[^"]+\.js)"/);
  if (!jsMatch) {
    console.error("Could not find main JS bundle");
    return;
  }

  const jsUrl = `${PLL_STATS_URL}${jsMatch[1]}`;
  console.log(`Fetching: ${jsUrl}\n`);

  const js = await fetch(jsUrl).then((r) => r.text());

  const queryPattern = /"\\nquery\(\$[^"]+"/g;
  const matches = js.match(queryPattern) ?? [];

  console.log(`Found ${matches.length} queries:\n`);

  const seen = new Set<string>();
  for (const match of matches) {
    const clean = match.replaceAll(/^"|"$/g, "").replaceAll("\\n", "\n").trim();

    const opMatch = clean.match(/\{\s*(\w+)/);
    const opName = opMatch?.[1] ?? "unknown";

    if (seen.has(opName)) continue;
    seen.add(opName);

    const varsMatch = clean.match(/query\(([^)]+)\)/);
    const vars = varsMatch?.[1] ?? "";

    console.log(`=== ${opName} ===`);
    console.log(`Variables: ${vars}`);
    console.log(clean.slice(0, 600) + "...\n");
  }
}

await extractQueries().catch(console.error);
