import { spawnSync } from "node:child_process";

import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

export const prodStage = "prod";
export const devStage = "dev";

const PRODUCTION = "laxdb.io";
const DEV = "dev.laxdb.io";
const repoRoot = new URL(".", import.meta.url);

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const workerEnv = () => ({
  GOOGLE_CLIENT_ID: requiredEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: Redacted.make(requiredEnv("GOOGLE_CLIENT_SECRET")),
  BETTER_AUTH_SECRET: Redacted.make(requiredEnv("BETTER_AUTH_SECRET")),
  POLAR_WEBHOOK_SECRET: Redacted.make(requiredEnv("POLAR_WEBHOOK_SECRET")),
  AWS_REGION: process.env.AWS_REGION ?? "us-west-2",
  EMAIL_SENDER: process.env.EMAIL_SENDER ?? "noreply@laxdb.io",
});

const getDomain = (stage: string, subdomain?: string) => {
  const prefix = subdomain ? `${subdomain}.` : "";
  if (stage === prodStage) return `${prefix}${PRODUCTION}`;
  if (stage === devStage) return `${prefix}${DEV}`;
  return `${prefix}${stage}.${DEV}`;
};

const databaseName = (stage: string) =>
  stage === prodStage ? "laxdb" : `laxdb-${stage}`;

const alchemyPhase = () => process.env.ALCHEMY_PHASE ?? "plan";

const isLocalPhase = (phase: string) => phase === "dev";

const generateDrizzleMigrations = Effect.try({
  try: () => {
    const result = spawnSync("bun", ["run", "db:generate"], {
      cwd: new URL("./packages/core", repoRoot),
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error(
        `Drizzle migration generation failed with exit code ${result.status ?? "unknown"}`,
      );
    }
  },
  catch: (cause) => cause,
}).pipe(Effect.orDie);

const runLocalSetup = Effect.gen(function* () {
  if (isLocalPhase(alchemyPhase())) {
    yield* generateDrizzleMigrations;
  }
});

export const database = Cloudflare.D1Database(
  "database",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    const readReplicationMode: "auto" | "disabled" =
      stage === prodStage ? "auto" : "disabled";

    return {
      name: databaseName(stage),
      migrationsDir: "./packages/core/migrations",
      readReplication: { mode: readReplicationMode },
    };
  }),
);

export const kv = Cloudflare.KVNamespace("kv");
export const storage = Cloudflare.R2Bucket("storage");

export const api = Cloudflare.Worker(
  "api",
  Effect.gen(function* () {
    const db = yield* database;
    const kvNamespace = yield* kv;
    const bucket = yield* storage;

    return {
      main: "packages/api/src/index.ts",
      url: true,
      compatibility: { flags: ["nodejs_compat"] },
      bindings: {
        DB: db,
        KV: kvNamespace,
        STORAGE: bucket,
      },
      env: workerEnv(),
    };
  }),
);

export const marketing = Cloudflare.Vite(
  "marketing",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    return {
      rootDir: "./packages/marketing",
      url: true,
      domain: getDomain(stage),
      compatibility: { flags: ["nodejs_compat"] },
    };
  }),
);

export const practicePlanner = Cloudflare.Vite(
  "practice-planner",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    const phase = alchemyPhase();

    return {
      rootDir: "./packages/practice-planner",
      url: true,
      domain: getDomain(stage, "planner"),
      compatibility: { flags: ["nodejs_compat"] },
      env: {
        IS_LOCAL: isLocalPhase(phase) ? "true" : "",
      },
    };
  }),
);

const maybePostPreviewComment = (
  marketingUrl: Output.Output<string | undefined>,
) =>
  Effect.gen(function* () {
    const pullRequest = process.env.PULL_REQUEST;
    if (!pullRequest) return;

    yield* GitHub.Comment("preview-comment", {
      owner: "jackwatters45",
      repository: "laxdb",
      issueNumber: Number(pullRequest),
      body: Output.interpolate`
        ## 🚀 Preview Deployed

        Your changes have been deployed to a preview environment:

        **🌐 Marketing:** ${marketingUrl}

        Built from commit ${process.env.GITHUB_SHA?.slice(0, 7) ?? "unknown"}

        ---
        <sub>🤖 This comment updates automatically with each push.</sub>`,
    });
  });

export default Alchemy.Stack(
  "laxdb",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    yield* runLocalSetup;

    const stage = yield* Alchemy.Stage;
    const db = yield* database;
    const kvNamespace = yield* kv;
    const bucket = yield* storage;
    const apiWorker = yield* api;
    const marketingWorker = yield* marketing;
    const practicePlannerWorker = yield* practicePlanner;

    yield* practicePlannerWorker.bind`API`({
      bindings: [
        {
          type: "service",
          name: "API",
          service: apiWorker.workerName,
        },
      ],
    });

    yield* maybePostPreviewComment(marketingWorker.url);

    return {
      domain: getDomain(stage),
      marketing: marketingWorker.url,
      practicePlanner: practicePlannerWorker.url,
      api: apiWorker.url,
      db: db.databaseId,
      kv: kvNamespace.namespaceId,
      r2: bucket.bucketName,
      stage,
    };
  }),
);
