import { Config, Duration, Effect, Layer, Redacted, ServiceMap } from "effect";

export interface PipelineConfigValues {
  readonly userAgent: string;
  readonly defaultTimeoutMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly rateLimitDelayMs: number;
  readonly maxConcurrency: number;
  readonly retryDelay: Duration.Duration;
  readonly defaultTimeout: Duration.Duration;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfigValues = {
  userAgent: "Mozilla/5.0 (compatible; LaxDBBot/1.0; +https://laxdb.io/bot)",
  defaultTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  rateLimitDelayMs: 100,
  maxConcurrency: 5,
  retryDelay: Duration.millis(1000),
  defaultTimeout: Duration.millis(30000),
};

export class PipelineConfig extends ServiceMap.Service<PipelineConfig>()(
  "PipelineConfig",
  {
    make: Effect.gen(function* () {
      const userAgent = yield* Config.string("PIPELINE_USER_AGENT").pipe(
        Config.withDefault(DEFAULT_PIPELINE_CONFIG.userAgent),
      );

      const defaultTimeoutMs = yield* Config.number(
        "PIPELINE_DEFAULT_TIMEOUT_MS",
      ).pipe(Config.withDefault(DEFAULT_PIPELINE_CONFIG.defaultTimeoutMs));

      const maxRetries = yield* Config.number("PIPELINE_MAX_RETRIES").pipe(
        Config.withDefault(DEFAULT_PIPELINE_CONFIG.maxRetries),
      );

      const retryDelayMs = yield* Config.number("PIPELINE_RETRY_DELAY_MS").pipe(
        Config.withDefault(DEFAULT_PIPELINE_CONFIG.retryDelayMs),
      );

      const rateLimitDelayMs = yield* Config.number(
        "PIPELINE_RATE_LIMIT_DELAY_MS",
      ).pipe(Config.withDefault(DEFAULT_PIPELINE_CONFIG.rateLimitDelayMs));

      const maxConcurrency = yield* Config.number(
        "PIPELINE_MAX_CONCURRENCY",
      ).pipe(Config.withDefault(DEFAULT_PIPELINE_CONFIG.maxConcurrency));

      return {
        userAgent,
        defaultTimeoutMs,
        maxRetries,
        retryDelayMs,
        rateLimitDelayMs,
        maxConcurrency,
        retryDelay: Duration.millis(retryDelayMs),
        defaultTimeout: Duration.millis(defaultTimeoutMs),
      } satisfies PipelineConfigValues;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}

export class PLLConfig extends ServiceMap.Service<PLLConfig>()("PLLConfig", {
  make: Effect.gen(function* () {
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
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}

export class NLLConfig extends ServiceMap.Service<NLLConfig>()("NLLConfig", {
  make: Effect.succeed({
    baseUrl: "https://nllstatsapp.aordev.com/",
    headers: {
      origin: "https://www.nll.com",
      referer: "https://www.nll.com/",
    },
  } as const),
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}

export class MLLConfig extends ServiceMap.Service<MLLConfig>()("MLLConfig", {
  make: Effect.succeed({
    statscrewBaseUrl: "https://www.statscrew.com/lacrosse",
    waybackCdxUrl: "https://web.archive.org/cdx/search/cdx",
    waybackWebUrl: "https://web.archive.org/web",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  } as const),
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}

export class MSLConfig extends ServiceMap.Service<MSLConfig>()("MSLConfig", {
  make: Effect.succeed({
    gamesheetBaseUrl: "https://gamesheetstats.com",
    mainSiteBaseUrl: "https://www.majorserieslacrosse.ca",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  } as const),
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}

export class WLAConfig extends ServiceMap.Service<WLAConfig>()("WLAConfig", {
  make: Effect.succeed({
    baseUrl: "https://www.wlalacrosse.com",
    statsUrl: "https://www.wlalacrosse.com/stats",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  } as const),
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly Default = this.layer;
}
