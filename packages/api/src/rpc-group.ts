import { RpcGroup } from "@effect/rpc";

import { AuthRpcs } from "./auth/auth.rpc";
import { GameRpcs } from "./game/game.rpc";
import { OrganizationRpcs } from "./organization/organization.rpc";
import { ContactInfoRpcs } from "./player/contact-info/contact-info.rpc";
import { PlayerRpcs } from "./player/player.rpc";
import { SeasonRpcs } from "./season/season.rpc";
import { TeamRpcs } from "./team/team.rpc";

// Combined RpcGroup that merges all domain RPC groups
export class LaxdbRpc extends RpcGroup.make()
  .merge(SeasonRpcs)
  .merge(GameRpcs)
  .merge(PlayerRpcs)
  .merge(ContactInfoRpcs)
  .merge(TeamRpcs)
  .merge(OrganizationRpcs)
  .merge(AuthRpcs) {}
