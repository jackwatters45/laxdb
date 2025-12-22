import { Layer } from 'effect';
import { RpcAuthClient } from './auth/auth.client';
import { RpcGameClient } from './game/game.client';
import { RpcOrganizationClient } from './organization/organization.client';
import { RpcContactInfoClient } from './player/contact-info/contact-info.client';
import { RpcPlayerClient } from './player/player.client';
import { RpcSeasonClient } from './season/season.client';
import { RpcTeamClient } from './team/team.client';

export const RpcClientLive = Layer.mergeAll(
  RpcGameClient.Default,
  RpcSeasonClient.Default,
  RpcPlayerClient.Default,
  RpcContactInfoClient.Default,
  RpcTeamClient.Default,
  RpcOrganizationClient.Default,
  RpcAuthClient.Default
);
