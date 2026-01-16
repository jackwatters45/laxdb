import { Layer } from "effect";
import { AuthGroupLive } from "../auth/auth.handlers";
import { GamesGroupLive } from "../game/game.handlers";
import { OrganizationsGroupLive } from "../organization/organization.handlers";
import { ContactInfoGroupLive } from "../player/contact-info/contact-info.handlers";
import { PlayersGroupLive } from "../player/player.handlers";
import { SeasonsGroupLive } from "../season/season.handlers";
import { TeamsGroupLive } from "../team/team.handlers";

// Merge all HTTP API group handlers into a single layer
export const HttpGroupsLive = Layer.mergeAll(
  SeasonsGroupLive,
  GamesGroupLive,
  PlayersGroupLive,
  ContactInfoGroupLive,
  TeamsGroupLive,
  OrganizationsGroupLive,
  AuthGroupLive,
);
