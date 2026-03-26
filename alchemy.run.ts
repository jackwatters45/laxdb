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

const getDomain = (subdomain?: string) => {
  const prefix = subdomain ? `${subdomain}.` : "";
  if (stage === prodStage) return `${prefix}${PRODUCTION}`;
  if (stage === devStage) return `${prefix}${DEV}`;
  return `${prefix}${stage}.${DEV}`;
};

export const domain = getDomain();

// DB
const database = await Database("Database", {
  name: "laxdb",
  clusterSize: "PS_5",
  kind: "postgresql",
  organization: "johnwatt",
  // allowDataBranching: true,
  adopt: true,
});

// Dev/staging branch
const devBranch = await Branch("dev-branch", {
  name: "development",
  organization: "johnwatt",
  database,
  parentBranch: "main",
  isProduction: false,
  adopt: true,
});

// Personal dev branch
const personalBranch = await Branch("personal-branch", {
  name: "personal",
  organization: "johnwatt",
  database,
  parentBranch: "main",
  isProduction: false,
  adopt: true,
});

// Branch selection based on stage
const currentBranch =
  stage === prodStage
    ? database.defaultBranch
    : stage === devStage || stage.startsWith("pr-")
      ? devBranch
      : personalBranch;

// Schema role — stable per branch, owns tables, used for migrations/push
const branchName = currentBranch === devBranch ? "dev" : currentBranch === personalBranch ? "personal" : "main";
const schemaRole = await Role(`db-schema-${branchName}-v2`, {
  database,
  branch: currentBranch,
  inheritedRoles: ["postgres"],
});

// Runtime role — per stage, used by workers
const dbRole = await Role(`db-role-${stage}-v3`, {
  database,
  branch: currentBranch,
  inheritedRoles: ["postgres"],
});

// Hyperdrive connection pooling
const db = await Hyperdrive("hyperdrive", {
  origin: dbRole.connectionUrl,
  adopt: true,
});

// Generate Drizzle migrations (v1 — disabled while developing v2)
// Schema management: generate + push locally, migrate in CI/prod
if (app.local) {
  await Exec("DrizzleGenerate", {
    command: "cd packages/core && bun run db:generate",
    env: { DATABASE_URL: schemaRole.connectionUrl },
    memoize: {
      patterns: ["drizzle.config.ts", "src/schema.ts"],
    },
  });

  await Exec("DrizzlePushV2", {
    command: "cd packages/core-v2 && bun run db:push",
    env: { DATABASE_URL: schemaRole.connectionUrl },
  });
} else {
  await Exec("DrizzleMigrateV2", {
    command: `sh -c 'cd packages/core-v2 && bun run db:migrate || ( [ $? -eq 9 ] && exit 0 ); exit $?'`,
    env: { DATABASE_URL: schemaRole.connectionUrl },
    memoize: {
      patterns: [
        "packages/core-v2/drizzle.config.ts",
        "packages/core-v2/migrations/**/*.sql",
      ],
    },
  });
}

// Start Drizzle Studio in local development
// if (app.local) {
//   Exec("DrizzleStudio", {
//     command: "cd packages/core-v2 && bun run db:studio",
//     env: {
//       DATABASE_URL: dbRole.connectionUrl,
//     },
//   });

//   Exec("Storybook", {
//     command: "cd packages/ui && bun run storybook",
//   });
// }

// KV
export const kv = await KVNamespace("kv", {});

// Storage
export const storage = await R2Bucket("storage", {});

export const api2 = await Worker("api-v2", {
  entrypoint: "packages/api-v2/src/index.ts",
  url: true,
  compatibility: "node",
  bindings: {
    DB: db,
    KV: kv,
    STORAGE: storage,
    DATABASE_URL: dbRole.connectionUrl,
    ...secrets,
  },
});

// export const web = await TanStackStart("web", {
//   cwd: "./packages/web",
//   domains: [getDomain("app")],
//   bindings: {
//     DB: db,
//     KV: kv,
//     STORAGE: storage,
//     DATABASE_URL: dbRole.connectionUrl,
//     ...secrets,
//   },
// });

export const marketing = await TanStackStart("marketing", {
  bindings: {},
  cwd: "./packages/marketing",
  domains: [domain],
});

// export const docs = await TanStackStart("docs", {
//   bindings: {},
//   cwd: "./packages/docs",
//   domains: [getDomain("docs")],
// });

export const practicePlanner = await TanStackStart("practice-planner", {
  bindings: {
    API: api2,
    IS_LOCAL: app.local ? "true" : "",
  },
  cwd: "./packages/practice-planner",
  domains: [getDomain("planner")],
});

console.log({
  domain,
  // web: web.url,
  marketing: marketing.url,
  practicePlanner: practicePlanner.url,
  // docs: docs.url,
  api2: api2.url,
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
