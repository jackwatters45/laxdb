import type { D1Database } from "@cloudflare/workers-types";
import { AuthService } from "@laxdb/core/auth/auth.service";
import { ClubService } from "@laxdb/core/club/club.service";
import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { DrillService } from "@laxdb/core/drill/drill.service";
import { DatabaseLiveFromBinding } from "@laxdb/core/drizzle/drizzle.service";
import { EmailService } from "@laxdb/core/email/email.service";
import { FineService } from "@laxdb/core/fine/fine.service";
import { MatchService } from "@laxdb/core/match/match.service";
import { PlayService } from "@laxdb/core/play/play.service";
import { PlayerService } from "@laxdb/core/player/player.service";
import { PracticeService } from "@laxdb/core/practice/practice.service";
import { StatsService } from "@laxdb/core/stats/stats.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { Layer } from "effect";
import * as Effect from "effect/Effect";

import { emailConfigFromEnv } from "./auth/auth";
import { AuthHandlers } from "./auth/auth.handlers";
import { ClubHandlers } from "./club/club.handlers";
import { DefaultsHandlers } from "./defaults/defaults.handlers";
import { DrillsHandlers } from "./drill/drill.handlers";
import { FinesHandlers } from "./fine/fines.handlers";
import { MatchesHandlers } from "./match/match.handlers";
import { PlaysHandlers } from "./play/play.handlers";
import { PlayersHandlers } from "./player/player.handlers";
import { PracticesHandlers } from "./practice/practice.handlers";
import { StatsHandlers } from "./stats/stats.handlers";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isD1Binding = (value: unknown): value is D1Database =>
  isRecord(value) && typeof value.prepare === "function";

const isD1Env = (value: unknown): value is { readonly DB: D1Database } =>
  isRecord(value) && isD1Binding(value.DB);

export const CoreServicesLive = Layer.mergeAll(
  AuthService.layer,
  ClubService.layer,
  DefaultsService.layer,
  DrillService.layer,
  FineService.layer,
  MatchService.layer,
  PlayService.layer,
  PlayerService.layer,
  PracticeService.layer,
  StatsService.layer,
);

export const DatabaseLive = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* Cloudflare.WorkerEnvironment;
    if (!isD1Env(env)) {
      return yield* Effect.die(
        new Error("Cloudflare D1 binding DB is missing from api worker env"),
      );
    }
    return DatabaseLiveFromBinding(env.DB);
  }),
);

export const EmailLive = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* Cloudflare.WorkerEnvironment;
    return EmailService.layerFromConfig(emailConfigFromEnv(env));
  }),
);

export const ServicesLive = CoreServicesLive.pipe(
  Layer.provide([DatabaseLive, EmailLive]),
);

export const HttpGroups = Layer.mergeAll(
  AuthHandlers,
  ClubHandlers,
  DefaultsHandlers,
  DrillsHandlers,
  FinesHandlers,
  MatchesHandlers,
  PlaysHandlers,
  PlayersHandlers,
  PracticesHandlers,
  StatsHandlers,
);

// Test/server harness wiring: Config-based EmailService (log-only without a
// key) instead of the worker-env EmailLive used by the deployed worker.
export const HttpGroupsLive = HttpGroups.pipe(
  Layer.provide(CoreServicesLive),
  Layer.provide(EmailService.layer),
);
