import { Exec } from "alchemy/os";
import alchemy from "alchemy";
import { CloudflareStateStore } from "alchemy/state";
import { GitHubComment } from "alchemy/github";
import {
  D1Database,
  KVNamespace,
  R2Bucket,
  TanStackStart,
  Worker,
} from "alchemy/cloudflare";

export const app = await alchemy("laxdb", {
  stateStore: (scope) =>
    new CloudflareStateStore(scope, { scriptName: `app-state-${scope.stage}` }),
});

// Stage
export const stage = app.stage;

export const prodStage = "prod";
export const devStage = "dev";

export const secrets = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: alchemy.secret(process.env.GOOGLE_CLIENT_SECRET!),
  BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET!),
  POLAR_WEBHOOK_SECRET: alchemy.secret(process.env.POLAR_WEBHOOK_SECRET!),
  AWS_REGION: process.env.AWS_REGION ?? "us-west-2",
  EMAIL_SENDER: process.env.EMAIL_SENDER ?? "noreply@laxdb.io",
};

// Domain
const PRODUCTION = "laxdb.io";
const DEV = "dev.laxdb.io";

const getDomain = (subdomain?: string) => {
  const prefix = subdomain ? `${subdomain}.` : "";
  if (stage === prodStage) return `${prefix}${PRODUCTION}`;
  if (stage === devStage) return `${prefix}${DEV}`;
  return `${prefix}${stage}.${DEV}`;
};

export const domain = getDomain();

// Generate Drizzle migrations before D1 reads the migrations directory locally.
// Schema management: generate locally, apply committed migrations through D1.
if (app.local) {
  await Exec("DrizzleGenerate", {
    command: "cd packages/core && bun run db:generate",
    memoize: {
      patterns: [
        "packages/core/drizzle.config.ts",
        "packages/core/src/**/*.sql.ts",
      ],
    },
  });
}

// DB
const databaseName = stage === prodStage ? "laxdb" : `laxdb-${stage}`;
const database = await D1Database("database", {
  name: databaseName,
  adopt: true,
  migrationsDir: "./packages/core/migrations",
  readReplication: { mode: stage === prodStage ? "auto" : "disabled" },
});

if (app.local) {
  Exec("Storybook", {
    command: "cd packages/ui && bun run storybook",
  });
}

// KV
export const kv = await KVNamespace("kv", {});

// Storage
export const storage = await R2Bucket("storage", {});

export const api = await Worker("api", {
  entrypoint: "packages/api/src/index.ts",
  url: true,
  compatibility: "node",
  bindings: {
    DB: database,
    KV: kv,
    STORAGE: storage,
    ...secrets,
  },
});

export const marketing = await TanStackStart("marketing", {
  bindings: {},
  cwd: "./packages/marketing",
  domains: [domain],
});

export const practicePlanner = await TanStackStart("practice-planner", {
  bindings: {
    API: api,
    IS_LOCAL: app.local ? "true" : "",
  },
  cwd: "./packages/practice-planner",
  domains: [getDomain("planner")],
});

console.log({
  domain,
  marketing: marketing.url,
  practicePlanner: practicePlanner.url,
  api: api.url,
  db: database.id,
  kv: kv.namespaceId,
  r2: storage.name,
  stage,
});

if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "jackwatters45",
    repository: "laxdb",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
     ## 🚀 Preview Deployed

     Your changes have been deployed to a preview environment:

     // **🌐 Docs:** {docs.url}
     **🌐 Marketing:** ${marketing.url}
     // **🌐 Website:** {web.url}

     Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

     ---
     <sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

await app.finalize();
