import {
  Clock,
  Effect,
  Schema,
  Array as Arr,
  Context,
  Layer,
  Result,
} from "effect";

import { PipelineConfig } from "../config";
import { formatUnknownError } from "../util";

import { ScraperClient } from "./scraper.client";
import {
  BatchScrapeRequest,
  type BatchScrapeResponse,
  ScrapeRequest,
  type ScrapeResult,
} from "./scraper.schema";

export class ScraperService extends Context.Service<ScraperService>()(
  "ScraperService",
  {
    make: Effect.gen(function* () {
      const client = yield* ScraperClient;
      const config = yield* PipelineConfig;

      return {
        scrape: (input: ScrapeRequest) =>
          Effect.gen(function* () {
            const request =
              yield* Schema.decodeUnknownEffect(ScrapeRequest)(input);
            return yield* client.fetchWithRetry(request);
          }).pipe(
            Effect.tap((response) =>
              Effect.log(
                `Scraped ${response.url} (${response.statusCode}) in ${response.durationMs}ms`,
              ),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to scrape: ${formatUnknownError(error)}`),
            ),
          ),

        scrapeBatch: (input: BatchScrapeRequest) =>
          Effect.gen(function* () {
            const request =
              yield* Schema.decodeUnknownEffect(BatchScrapeRequest)(input);
            const startTime = yield* Clock.currentTimeMillis;

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
                    Effect.catchTags({
                      ScraperHttpError: (error) =>
                        Effect.succeed<ScrapeResult>({
                          url,
                          success: false,
                          response: undefined,
                          error: formatUnknownError(error),
                        }),
                      ScraperTimeoutError: (error) =>
                        Effect.succeed<ScrapeResult>({
                          url,
                          success: false,
                          response: undefined,
                          error: formatUnknownError(error),
                        }),
                      ScraperRateLimitError: (error) =>
                        Effect.succeed<ScrapeResult>({
                          url,
                          success: false,
                          response: undefined,
                          error: formatUnknownError(error),
                        }),
                      ScraperNetworkError: (error) =>
                        Effect.succeed<ScrapeResult>({
                          url,
                          success: false,
                          response: undefined,
                          error: formatUnknownError(error),
                        }),
                    }),
                  ),
              { concurrency },
            );

            const successCount = Arr.filter(results, (r) => r.success).length;
            const failureCount = results.length - successCount;
            const endTime = yield* Clock.currentTimeMillis;
            const totalDurationMs = endTime - startTime;

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
            const startTime = yield* Clock.currentTimeMillis;
            const result = yield* client
              .fetch({
                url,
                timeoutMs: 5000,
                followRedirects: true,
              })
              .pipe(Effect.result);
            const endTime = yield* Clock.currentTimeMillis;
            const durationMs = endTime - startTime;

            if (Result.isSuccess(result)) {
              return {
                url,
                accessible: true,
                statusCode: result.success.statusCode,
                durationMs,
              };
            }

            return {
              url,
              accessible: false,
              statusCode: undefined,
              durationMs,
              error: formatUnknownError(result.failure),
            };
          }),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(ScraperClient.layer, PipelineConfig.layer)),
  );
}
