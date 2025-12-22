import { FetchHttpClient } from '@effect/platform';
import { RpcClient } from '@effect/rpc';
import { AtomHttpApi, AtomRpc } from '@effect-atom/atom-react';
import { Effect } from 'effect';
import { RpcProtocolLive } from '../protocol';
import { TeamsApi } from './team.api';
import { TeamRpcs } from './team.rpc';

export class RpcTeamClient extends Effect.Service<RpcTeamClient>()(
  'RpcTeamClient',
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(TeamRpcs),
  }
) {}

export class RpcTeamClientAtom extends AtomRpc.Tag<RpcTeamClientAtom>()(
  'RpcTeamClientAtom',
  {
    group: TeamRpcs,
    protocol: RpcProtocolLive,
  }
) {}

export class HttpTeamClientAtom extends AtomHttpApi.Tag<HttpTeamClientAtom>()(
  'HttpTeamClientAtom',
  {
    api: TeamsApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: process.env.API_URL!,
  }
) {}
