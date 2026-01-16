import { HttpApi } from "@effect/platform";
import { GamesGroup } from "./game/game.api";
import { ContactInfoGroup } from "./player/contact-info/contact-info.api";
import { PlayersGroup } from "./player/player.api";
import { SeasonsGroup } from "./season/season.api";

// Unified API definition - groups added as they are migrated
export class LaxdbApi extends HttpApi.make("LaxdbApi")
  .add(SeasonsGroup)
  .add(GamesGroup)
  .add(PlayersGroup)
  .add(ContactInfoGroup) {}
