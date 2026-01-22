import { Layer } from "effect";

import { AuthHandlers } from "./auth/auth.rpc";
import { GameHandlers } from "./game/game.rpc";
import { OrganizationHandlers } from "./organization/organization.rpc";
import { PlayersHandlers } from "./pipeline/players.rpc";
import { StatsHandlers } from "./pipeline/stats.rpc";
import { TeamsHandlers } from "./pipeline/teams.rpc";
import { ContactInfoHandlers } from "./player/contact-info/contact-info.rpc";
import { PlayerHandlers } from "./player/player.rpc";
import { SeasonHandlers } from "./season/season.rpc";
import { TeamHandlers } from "./team/team.rpc";

// Combined handlers layer for all RPC groups
export const LaxdbRpcHandlers = Layer.mergeAll(
  SeasonHandlers,
  GameHandlers,
  PlayerHandlers,
  ContactInfoHandlers,
  TeamHandlers,
  OrganizationHandlers,
  AuthHandlers,
  StatsHandlers,
  PlayersHandlers,
  TeamsHandlers,
);
