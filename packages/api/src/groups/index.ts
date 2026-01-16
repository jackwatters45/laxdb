import { Layer } from "effect";

import { AuthHandlersLive } from "../auth/auth.handlers";
import { GamesHandlersLive } from "../game/game.handlers";
import { OrganizationsHandlersLive } from "../organization/organization.handlers";
import { ContactInfoHandlersLive } from "../player/contact-info/contact-info.handlers";
import { PlayersHandlersLive } from "../player/player.handlers";
import { SeasonsHandlersLive } from "../season/season.handlers";
import { TeamsHandlersLive } from "../team/team.handlers";

// Merge all HTTP API group handlers into a single layer
export const HttpGroupsLive = Layer.mergeAll(
  SeasonsHandlersLive,
  GamesHandlersLive,
  PlayersHandlersLive,
  ContactInfoHandlersLive,
  TeamsHandlersLive,
  OrganizationsHandlersLive,
  AuthHandlersLive,
);
