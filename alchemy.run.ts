import { spawnSync } from "node:child_process";

import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

import { makeApiWorker } from "./packages/api/src/index.ts";

const config = {
  stack: "laxdb",
  stages: {
    prod: "prod",
    dev: "dev",
  },
  domains: {
    production: "laxdb.io",
    development: "dev.laxdb.io",
  },
};

const baseDomainForStage = (stage: string) =>
  stage === config.stages.prod
    ? config.domains.production
    : stage === config.stages.dev
      ? config.domains.development
      : `${stage}.${config.domains.development}`;

export const database = Cloudflare.D1Database(
  "database",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;

    return {
      name:
        stage === config.stages.prod
          ? config.stack
          : `${config.stack}-${stage}`,
      migrationsDir: "./packages/core/migrations",
      readReplication: {
        mode:
          stage === config.stages.prod
            ? ("auto" as const)
            : ("disabled" as const),
      },
    };
  }),
);

export const kv = Cloudflare.KVNamespace("kv");
export const storage = Cloudflare.R2Bucket("storage");

const stackSecrets = Config.all({
  betterAuthSecret: Config.redacted("BETTER_AUTH_SECRET").pipe(
    Config.withDefault(Redacted.make("")),
  ),
  betterAuthUrl: Config.string("BETTER_AUTH_URL").pipe(Config.withDefault("")),
  emailSender: Config.string("EMAIL_SENDER").pipe(Config.withDefault("")),
  googleClientId: Config.string("GOOGLE_CLIENT_ID").pipe(
    Config.withDefault(""),
  ),
  googleClientSecret: Config.redacted("GOOGLE_CLIENT_SECRET").pipe(
    Config.withDefault(Redacted.make("")),
  ),
  resendApiKey: Config.redacted("RESEND_API_KEY").pipe(
    Config.withDefault(Redacted.make("")),
  ),
  trustedOrigins: Config.string("TRUSTED_ORIGINS").pipe(
    Config.withDefault(""),
  ),
});

export default Alchemy.Stack(
  config.stack,
  {
    providers: Cloudflare.providers().pipe(
      Layer.provideMerge(GitHub.providers()),
    ),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    if ((process.env.ALCHEMY_PHASE ?? "plan") === "dev") {
      yield* Effect.sync(() =>
        spawnSync("bun", ["run", "db:generate"], {
          cwd: "packages/core",
          stdio: "inherit",
        }),
      ).pipe(
        Effect.flatMap((result) =>
          result.status === 0
            ? Effect.void
            : Effect.die(
                new Error(
                  `Drizzle migration generation failed with exit code ${result.status ?? "unknown"}`,
                ),
              ),
        ),
      );
    }

    const stage = yield* Alchemy.Stage;
    const db = yield* database;
    const kvNamespace = yield* kv;
    const bucket = yield* storage;

    const baseDomain = baseDomainForStage(stage);
    const isLocal = stage !== config.stages.prod;
    const malvernOrigin = isLocal
      ? "http://localhost:1338"
      : `https://malvern.${baseDomain}`;
    const secrets = yield* stackSecrets;
    const trustedOrigins =
      secrets.trustedOrigins === ""
        ? [
            malvernOrigin,
            "http://localhost:1337",
            `https://malvern.${baseDomain}`,
          ].join(",")
        : secrets.trustedOrigins;

    const api = yield* makeApiWorker({
      DB: db,
      BETTER_AUTH_SECRET: secrets.betterAuthSecret,
      BETTER_AUTH_URL:
        secrets.betterAuthUrl === "" ? malvernOrigin : secrets.betterAuthUrl,
      EMAIL_SENDER: secrets.emailSender,
      IS_LOCAL: isLocal ? "true" : "",
      GOOGLE_CLIENT_ID: secrets.googleClientId,
      GOOGLE_CLIENT_SECRET: secrets.googleClientSecret,
      RESEND_API_KEY: isLocal ? Redacted.make("") : secrets.resendApiKey,
      TRUSTED_ORIGINS: trustedOrigins,
    });

    // const marketing = yield* Cloudflare.Vite("marketing", {
    //   rootDir: "./packages/marketing",
    //   url: true,
    //   domain: baseDomain,
    //   compatibility: { flags: ["nodejs_compat"] },
    //   dev: {
    //     port: 1339,
    //     strictPort: true,
    //   },
    // });

    const practicePlanner = yield* Cloudflare.Vite("practice-planner", {
      rootDir: "./packages/practice-planner",
      url: true,
      domain: `planner.${baseDomain}`,
      compatibility: { flags: ["nodejs_compat"] },
      dev: {
        port: 1340,
        strictPort: true,
      },
      env: {
        API: api,
        API_PORT: "1337",
        IS_LOCAL: isLocal ? "true" : "",
      },
    });

    const malvern = yield* Cloudflare.Vite("malvern", {
      rootDir: "./packages/malvern",
      url: true,
      domain: `malvern.${baseDomain}`,
      compatibility: { flags: ["nodejs_compat"] },
      dev: {
        port: 1338,
        strictPort: true,
      },
      // Service binding to the api worker. In v2 bindings go under `env`
      // (this is what populates `cf.env.API`); the low-level `bindings` field
      // is an internal WorkerBinding[] and does NOT wire the fetcher.
      env: {
        API: api,
        IS_LOCAL: isLocal ? "true" : "",
      },
    });

    if (process.env.PULL_REQUEST) {
      yield* GitHub.Comment("preview-comment", {
        owner: "jackwatters45",
        repository: "laxdb",
        issueNumber: Number(process.env.PULL_REQUEST),
        body: Output.interpolate`
         ## 🚀 Preview Deployed

         Your changes have been deployed to a preview environment:

         **🥍 Practice Planner:** ${practicePlanner.url}
         **🦅 Malvern:** ${malvern.url}

         Built from commit ${process.env.GITHUB_SHA?.slice(0, 7) ?? "unknown"}

         ---
         <sub>🤖 This comment updates automatically with each push.</sub>`,
      });
    }

    return {
      domain: baseDomain,
      practicePlanner: practicePlanner.url,
      malvern: malvern.url,
      api: api.url,
      db: db.databaseId,
      kv: kvNamespace.namespaceId,
      r2: bucket.bucketName,
      stage,
    };
  }),
);
