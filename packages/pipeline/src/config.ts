import { Config, Duration, Effect, Redacted } from "effect";

export class PipelineConfig extends Effect.Service<PipelineConfig>()(
  "PipelineConfig",
  {
    effect: Effect.gen(function* () {
      const userAgent = yield* Config.string("PIPELINE_USER_AGENT").pipe(
        Config.withDefault(
          "Mozilla/5.0 (compatible; LaxDBBot/1.0; +https://laxdb.io/bot)",
        ),
      );

      const defaultTimeoutMs = yield* Config.number(
        "PIPELINE_DEFAULT_TIMEOUT_MS",
      ).pipe(Config.withDefault(30000));

      const maxRetries = yield* Config.number("PIPELINE_MAX_RETRIES").pipe(
        Config.withDefault(3),
      );

      const retryDelayMs = yield* Config.number("PIPELINE_RETRY_DELAY_MS").pipe(
        Config.withDefault(1000),
      );

      const rateLimitDelayMs = yield* Config.number(
        "PIPELINE_RATE_LIMIT_DELAY_MS",
      ).pipe(Config.withDefault(100));

      const maxConcurrency = yield* Config.number(
        "PIPELINE_MAX_CONCURRENCY",
      ).pipe(Config.withDefault(5));

      return {
        userAgent,
        defaultTimeoutMs,
        maxRetries,
        retryDelayMs,
        rateLimitDelayMs,
        maxConcurrency,
        retryDelay: Duration.millis(retryDelayMs),
        defaultTimeout: Duration.millis(defaultTimeoutMs),
      } as const;
    }),
  },
) {}

export class PLLConfig extends Effect.Service<PLLConfig>()("PLLConfig", {
  effect: Effect.gen(function* () {
    const restToken = yield* Config.redacted("PLL_REST_TOKEN");
    const graphqlToken = yield* Config.redacted("PLL_GRAPHQL_TOKEN");

    return {
      rest: {
        baseUrl: "https://api.stats.premierlacrosseleague.com/api/v4",
        token: Redacted.value(restToken),
        headers: {
          authsource: "web",
          origin: "https://premierlacrosseleague.com",
          referer: "https://premierlacrosseleague.com/",
        },
      },
      graphql: {
        endpoint: "https://api.stats.premierlacrosseleague.com/graphql",
        token: Redacted.value(graphqlToken),
        headers: {
          origin: "https://stats.premierlacrosseleague.com",
          referer: "https://stats.premierlacrosseleague.com/",
        },
      },
    } as const;
  }),
}) {}
