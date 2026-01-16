import { Effect, Schema, Array as Arr } from "effect";

import { PipelineConfig } from "../config";

import { ScraperClient } from "./scraper.client";
import {
  BatchScrapeRequest,
  type BatchScrapeResponse,
  ScrapeRequest,
  type ScrapeResult,
} from "./scraper.schema";

export class ScraperService extends Effect.Service<ScraperService>()(
  "ScraperService",
  {
    effect: Effect.gen(function* () {
      const client = yield* ScraperClient;
      const config = yield* PipelineConfig;

      return {
        scrape: (input: ScrapeRequest) =>
          Effect.gen(function* () {
            const request = yield* Schema.decode(ScrapeRequest)(input);
            return yield* client.fetchWithRetry(request);
          }).pipe(
            Effect.tap((response) =>
              Effect.log(
                `Scraped ${response.url} (${response.statusCode}) in ${response.durationMs}ms`,
              ),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to scrape: ${String(error)}`),
            ),
          ),

        scrapeBatch: (input: BatchScrapeRequest) =>
          Effect.gen(function* () {
            const request = yield* Schema.decode(BatchScrapeRequest)(input);
            const startTime = Date.now();

            const concurrency = request.concurrency ?? config.maxConcurrency;

            const results = yield* Effect.forEach(
              request.urls,
              (url) =>
                client
                  .fetchWithRetry({
                    url,
                    headers: request.headers,
                    timeoutMs: request.timeoutMs,
                    followRedirects: true,
                  })
                  .pipe(
                    Effect.map(
                      (response): ScrapeResult => ({
                        url,
                        success: true,
                        response,
                        error: undefined,
                      }),
                    ),
                    Effect.catchAll((error) =>
                      Effect.succeed<ScrapeResult>({
                        url,
                        success: false,
                        response: undefined,
                        error: String(error),
                      }),
                    ),
                  ),
              { concurrency },
            );

            const successCount = Arr.filter(results, (r) => r.success).length;
            const failureCount = results.length - successCount;
            const totalDurationMs = Date.now() - startTime;

            return {
              results,
              totalCount: results.length,
              successCount,
              failureCount,
              totalDurationMs,
            } satisfies BatchScrapeResponse;
          }).pipe(
            Effect.tap((response) =>
              Effect.log(
                `Batch scrape: ${response.successCount}/${response.totalCount} in ${response.totalDurationMs}ms`,
              ),
            ),
          ),

        ping: (url: string) =>
          Effect.gen(function* () {
            const startTime = Date.now();
            const response = yield* client.fetch({
              url,
              timeoutMs: 5000,
              followRedirects: true,
            });
            return {
              url,
              accessible: true,
              statusCode: response.statusCode,
              durationMs: Date.now() - startTime,
            };
          }).pipe(
            Effect.catchAll((error) =>
              Effect.succeed({
                url,
                accessible: false,
                statusCode: undefined,
                durationMs: Date.now(),
                error: String(error),
              }),
            ),
          ),
      } as const;
    }),
    dependencies: [ScraperClient.Default, PipelineConfig.Default],
  },
) {}
