import { AuthService } from "@laxdb/core/auth/auth.service";
import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { DrillService } from "@laxdb/core/drill/drill.service";
import { DatabaseLiveFromBindingEffect } from "@laxdb/core/drizzle/drizzle.service";
import { FineService } from "@laxdb/core/fine/fine.service";
import { MalvernService } from "@laxdb/core/malvern/malvern.service";
import { PlayService } from "@laxdb/core/play/play.service";
import { PlayerService } from "@laxdb/core/player/player.service";
import { PracticeService } from "@laxdb/core/practice/practice.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { Layer } from "effect";
import * as Effect from "effect/Effect";

import { AuthHandlers } from "./auth/auth.handlers";
import { DefaultsHandlers } from "./defaults/defaults.handlers";
import { DrillsHandlers } from "./drill/drill.handlers";
import { FinesHandlers } from "./fine/fines.handlers";
import { MalvernHandlers } from "./malvern/malvern.handlers";
import { PlaysHandlers } from "./play/play.handlers";
import { PlayersHandlers } from "./player/player.handlers";
import { PracticesHandlers } from "./practice/practice.handlers";

export const CoreServicesLive = Layer.mergeAll(
  AuthService.layer,
  DefaultsService.layer,
  DrillService.layer,
  FineService.layer,
  MalvernService.layer,
  PlayService.layer,
  PlayerService.layer,
  PracticeService.layer,
);

export const DatabaseLive = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* Cloudflare.WorkerEnvironment;
    return DatabaseLiveFromBindingEffect(env.DB);
  }),
);

export const ServicesLive = CoreServicesLive.pipe(Layer.provide(DatabaseLive));

export const HttpGroups = Layer.mergeAll(
  AuthHandlers,
  DefaultsHandlers,
  DrillsHandlers,
  FinesHandlers,
  MalvernHandlers,
  PlaysHandlers,
  PlayersHandlers,
  PracticesHandlers,
);

export const HttpGroupsLive = HttpGroups.pipe(Layer.provide(CoreServicesLive));
