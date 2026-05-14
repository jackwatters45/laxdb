import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { DrillService } from "@laxdb/core/drill/drill.service";
import { DatabaseLiveFromBindingEffect } from "@laxdb/core/drizzle/drizzle.service";
import { PlayService } from "@laxdb/core/play/play.service";
import { PlayerService } from "@laxdb/core/player/player.service";
import { PracticeService } from "@laxdb/core/practice/practice.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { Layer } from "effect";
import * as Effect from "effect/Effect";

import { DefaultsHandlers } from "./defaults/defaults.handlers";
import { DrillsHandlers } from "./drill/drill.handlers";
import { PlaysHandlers } from "./play/play.handlers";
import { PlayersHandlers } from "./player/player.handlers";
import { PracticesHandlers } from "./practice/practice.handlers";

export const CoreServicesLive = Layer.mergeAll(
  DefaultsService.layer,
  DrillService.layer,
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
  DefaultsHandlers,
  DrillsHandlers,
  PlaysHandlers,
  PlayersHandlers,
  PracticesHandlers,
);

export const HttpGroupsLive = HttpGroups.pipe(Layer.provide(CoreServicesLive));
