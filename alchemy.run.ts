import { Exec } from "alchemy/os";
import { Branch, Database, Role } from "alchemy/planetscale";
import alchemy from "alchemy";
import { CloudflareStateStore } from "alchemy/state";
import { GitHubComment } from "alchemy/github";
import {
  Hyperdrive,
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
export const isPermanentStage = [prodStage, devStage].includes(stage);

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
export const domain =
  stage === prodStage
    ? PRODUCTION
    : stage === devStage
      ? DEV
      : `${stage}.${DEV}`;

// DB
const database = await Database("Database", {
  name: "laxdb",
  clusterSize: "PS_5",
  kind: "postgresql",
  organization: "johnwatt",
  allowDataBranching: true,
  adopt: true,
});

// Dev/staging branch
const devBranch = await Branch("dev-branch", {
  name: "development",
  organization: "johnwatt",
  database,
  parentBranch: "main",
  isProduction: false,
  adopt: true
});

// Personal dev branch
const personalBranch = await Branch("personal-branch", {
  name: "personal",
  organization: "johnwatt",
  database,
  parentBranch: "development",
  isProduction: false,
  adopt: true
});

// Branch selection based on stage
const currentBranch =
  stage === prodStage
    ? database.defaultBranch
    : stage === devStage
      ? devBranch
      : personalBranch;

// Admin role for current branch
const dbRole = await Role(`db-role-${stage}`, {
  database,
  branch: currentBranch,
  inheritedRoles: ["postgres"],
});

// Hyperdrive connection pooling
const db = await Hyperdrive("hyperdrive", {
  origin: dbRole.connectionUrl,
});

// Generate Drizzle migrations
await Exec("DrizzleGenerate", {
  command: "cd packages/core && bun run db:generate",
  env: {
    DATABASE_URL: dbRole.connectionUrl,
  },
  memoize: {
    patterns: ["drizzle.config.ts", "src/schema.ts"],
  },
});

// Apply migrations to the database
await Exec("DrizzleMigrate", {
  command:
    process.platform === "win32"
      ? `cmd /C "cd packages/core && bun run db:migrate || if %ERRORLEVEL%==9 exit 0 else exit %ERRORLEVEL%"`
      : `sh -c 'cd packages/core && bun run db:migrate || ( [ $? -eq 9 ] && exit 0 ); exit $?'`,
  env: {
    DATABASE_URL: dbRole.connectionUrl,
  },
  memoize: {
    patterns: ["drizzle.config.ts", "drizzle/*.sql"],
  },
});

// Start Drizzle Studio in local development
if (app.local) {
  Exec("DrizzleStudio", {
    command: "bun run db:studio",
    env: {
      DATABASE_URL: dbRole.connectionUrl,
    },
  });
}

// KV
export const kv = await KVNamespace("kv", {});

// Storage
export const storage = await R2Bucket("storage", {});

// export const worker = await Worker("api", {
//   entrypoint: "packages/api/src/index.ts",
//   url: true,
//   bindings: {
//     DB: db,
//     KV: kv,
//     STORAGE: storage,
//     DATABASE_URL: dbRole.connectionUrl,
//     ...secrets,
//   },
// });

export const web = await TanStackStart("web", {
  bindings: {
    DB: db,
    KV: kv,
    STORAGE: storage,
    DATABASE_URL: dbRole.connectionUrl,
    // API_URL: worker.url!,
    ...secrets,
  },
  cwd: "./packages/web",
  domains: [domain],
});

// export const marketing = await TanStackStart('marketing', {
//   bindings: {
//     DB: db,
//     KV: kv,
//     STORAGE: storage,
//   },
//   cwd: './packages/marketing',
//   domains: [domain],
// });

console.log({
  domain,
  webWorkers: web.url,
  // api: api.url,
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

     **🌐 Website:** ${web.url}

     Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

     ---
     <sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

await app.finalize();
