import { spawnSync } from "node:child_process";

import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

export const prodStage = "prod";
export const devStage = "dev";

const stackName = "laxdb";
const repoRoot = new URL(".", import.meta.url);

const domains = {
  production: "laxdb.io",
  development: "dev.laxdb.io",
};

const packageRoots = {
  api: "packages/api/src/index.ts",
  core: new URL("./packages/core", repoRoot),
  marketing: "./packages/marketing",
  practicePlanner: "./packages/practice-planner",
};

const nodeCompatibility = { flags: ["nodejs_compat"] };

const currentAlchemyPhase = () => process.env.ALCHEMY_PHASE ?? "plan";
const isLocalPhase = (phase: string) => phase === "dev";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const requireSecret = (name: string) => Redacted.make(requireEnv(name));

const apiWorkerEnv = () => ({
  GOOGLE_CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requireSecret("GOOGLE_CLIENT_SECRET"),
  BETTER_AUTH_SECRET: requireSecret("BETTER_AUTH_SECRET"),
  POLAR_WEBHOOK_SECRET: requireSecret("POLAR_WEBHOOK_SECRET"),
  AWS_REGION: process.env.AWS_REGION ?? "us-west-2",
  EMAIL_SENDER: process.env.EMAIL_SENDER ?? "noreply@laxdb.io",
});

const domainForStage = (stage: string, subdomain?: string) => {
  const baseDomain =
    stage === prodStage
      ? domains.production
      : stage === devStage
        ? domains.development
        : `${stage}.${domains.development}`;

  return subdomain ? `${subdomain}.${baseDomain}` : baseDomain;
};

const databaseNameForStage = (stage: string) =>
  stage === prodStage ? stackName : `${stackName}-${stage}`;

const readReplicationForStage = (stage: string): "auto" | "disabled" =>
  stage === prodStage ? "auto" : "disabled";

class MigrationGenerationError extends Data.TaggedError(
  "MigrationGenerationError",
)<{
  cause: unknown;
}> {}

const generateDrizzleMigrations = Effect.try({
  try: () => {
    const result = spawnSync("bun", ["run", "db:generate"], {
      cwd: packageRoots.core,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error(
        `Drizzle migration generation failed with exit code ${result.status ?? "unknown"}`,
      );
    }
  },
  catch: (cause) => new MigrationGenerationError({ cause }),
}).pipe(Effect.orDie);

const runLocalSetup = Effect.gen(function* () {
  if (isLocalPhase(currentAlchemyPhase())) {
    yield* generateDrizzleMigrations;
  }
});

export const database = Cloudflare.D1Database(
  "database",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;

    return {
      name: databaseNameForStage(stage),
      migrationsDir: "./packages/core/migrations",
      readReplication: { mode: readReplicationForStage(stage) },
    };
  }),
);

export const kv = Cloudflare.KVNamespace("kv");
export const storage = Cloudflare.R2Bucket("storage");

export const api = Cloudflare.Worker(
  "api",
  Effect.gen(function* () {
    return {
      main: packageRoots.api,
      url: true,
      compatibility: nodeCompatibility,
      bindings: {
        DB: yield* database,
        KV: yield* kv,
        STORAGE: yield* storage,
      },
      env: apiWorkerEnv(),
    };
  }),
);

export const marketing = Cloudflare.Vite(
  "marketing",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;

    return {
      rootDir: packageRoots.marketing,
      url: true,
      domain: domainForStage(stage),
      compatibility: nodeCompatibility,
    };
  }),
);

export const practicePlanner = Cloudflare.Vite(
  "practice-planner",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;

    return {
      rootDir: packageRoots.practicePlanner,
      url: true,
      domain: domainForStage(stage, "planner"),
      compatibility: nodeCompatibility,
      bindings: {
        API: api,
      },
      env: {
        IS_LOCAL: isLocalPhase(currentAlchemyPhase()) ? "true" : "",
      },
    };
  }),
);

type ApiWorkerVariables = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  POLAR_WEBHOOK_SECRET: string;
  AWS_REGION: string;
  EMAIL_SENDER: string;
};

type AlchemyRuntimeVariables = {
  ALCHEMY_STACK_NAME: string;
  ALCHEMY_STAGE: string;
};

export type ApiWorkerEnv = Cloudflare.InferEnv<typeof api> &
  ApiWorkerVariables &
  AlchemyRuntimeVariables;

export type PracticePlannerWorkerEnv = Cloudflare.InferEnv<
  typeof practicePlanner
> &
  AlchemyRuntimeVariables & {
    IS_LOCAL: string;
  };

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
  stackName,
  {
    providers: GitHub.providers().pipe(
      Layer.provideMerge(Cloudflare.providers()),
    ),
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

    yield* maybePostPreviewComment(marketingWorker.url);

    return {
      domain: domainForStage(stage),
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
