import { spawnSync } from "node:child_process";

import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import Api from "./packages/api/src/index.ts";

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
    const api = yield* Api;

    const baseDomain = baseDomainForStage(stage);

    const marketing = yield* Cloudflare.Vite("marketing", {
      rootDir: "./packages/marketing",
      url: true,
      domain: baseDomain,
      compatibility: { flags: ["nodejs_compat"] },
    });

    const practicePlanner = yield* Cloudflare.Vite("practice-planner", {
      rootDir: "./packages/practice-planner",
      url: true,
      domain: `planner.${baseDomain}`,
      compatibility: { flags: ["nodejs_compat"] },
      bindings: {
        API: api,
      },
      env: {
        IS_LOCAL: (process.env.ALCHEMY_PHASE ?? "plan") === "dev" ? "true" : "",
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

         **🌐 Marketing:** ${marketing.url}

         Built from commit ${process.env.GITHUB_SHA?.slice(0, 7) ?? "unknown"}

         ---
         <sub>🤖 This comment updates automatically with each push.</sub>`,
      });
    }

    return {
      domain: baseDomain,
      marketing: marketing.url,
      practicePlanner: practicePlanner.url,
      api: api.url,
      db: db.databaseId,
      kv: kvNamespace.namespaceId,
      r2: bucket.bucketName,
      stage,
    };
  }),
);
