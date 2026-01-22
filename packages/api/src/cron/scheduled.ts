/**
 * Cron scheduled handler for pipeline data extraction
 *
 * Runs hourly to extract and load data from active leagues.
 * Each league is processed independently - one failure doesn't stop others.
 */

import { getActiveLeagues, type LeagueAbbreviation } from "@laxdb/pipeline/config/seasons";

/**
 * Cloudflare Worker environment bindings
 */
interface Env {
  PIPELINE_KV: KVNamespace;
  DATABASE_URL: string;
}

/**
 * Extract data from a league's source API
 *
 * @param league - The league abbreviation
 * @param env - Cloudflare Worker environment
 */
async function extractLeague(league: LeagueAbbreviation, env: Env): Promise<void> {
  console.log(`[${league}] Starting extraction...`);

  // TODO: Implement actual extraction using @laxdb/pipeline extractors
  // For MVP, this is a placeholder that logs progress
  // Will call extractNLL, extractPLL, etc. based on league

  console.log(`[${league}] Extraction complete`);
}

/**
 * Load extracted data into the database
 *
 * @param league - The league abbreviation
 * @param env - Cloudflare Worker environment
 */
async function loadLeague(league: LeagueAbbreviation, env: Env): Promise<void> {
  console.log(`[${league}] Loading data...`);

  // TODO: Implement actual data loading
  // Will insert/update records in pipeline_* tables

  console.log(`[${league}] Load complete`);
}

/**
 * Invalidate cached data for a league
 *
 * @param league - The league abbreviation
 * @param env - Cloudflare Worker environment
 */
async function invalidateCache(league: LeagueAbbreviation, env: Env): Promise<void> {
  console.log(`[${league}] Invalidating cache...`);

  // Delete cached leaderboard data for this league
  const cacheKeys = [
    `cache:leaderboard:${league}`,
    `cache:players:${league}`,
    `cache:teams:${league}`,
  ];

  await Promise.all(cacheKeys.map((key) => env.PIPELINE_KV.delete(key)));

  console.log(`[${league}] Cache invalidated`);
}

/**
 * Scheduled cron handler
 *
 * Called by Cloudflare Workers on the configured schedule (hourly).
 * Processes all currently active leagues in parallel with error isolation.
 */
export async function scheduled(
  _controller: ScheduledController,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const startTime = Date.now();
  console.log(`[Cron] Starting scheduled extraction at ${new Date().toISOString()}`);

  // Get leagues that are currently in-season
  const activeLeagues = getActiveLeagues(new Date());

  if (activeLeagues.length === 0) {
    console.log("[Cron] No active leagues, skipping extraction");
    return;
  }

  console.log(`[Cron] Active leagues: ${activeLeagues.join(", ")}`);

  // Run all extractions in parallel, don't let one failure stop others
  const results = await Promise.allSettled(
    activeLeagues.map(async (league) => {
      await extractLeague(league, env);
      await loadLeague(league, env);
      await invalidateCache(league, env);
    }),
  );

  // Log results
  let successCount = 0;
  let failureCount = 0;

  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      successCount++;
      console.log(`[Cron] ${activeLeagues[i]} completed successfully`);
    } else {
      failureCount++;
      console.error(`[Cron] ${activeLeagues[i]} failed:`, result.reason);
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `[Cron] Completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}`,
  );
}
