import { FetchHttpClient } from '@effect/platform';
import { RpcClient } from '@effect/rpc';
import { AtomHttpApi, AtomRpc } from '@effect-atom/atom-react';
import { Effect } from 'effect';
import { RpcProtocolLive } from '../protocol';
import { AuthApi } from './auth.api';
import { AuthRpcs } from './auth.rpc';

export class RpcAuthClient extends Effect.Service<RpcAuthClient>()(
  'RpcAuthClient',
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(AuthRpcs),
  }
) {}

export class RpcAuthClientAtom extends AtomRpc.Tag<RpcAuthClientAtom>()(
  'RpcAuthClientAtom',
  {
    group: AuthRpcs,
    protocol: RpcProtocolLive,
  }
) {}

export class HttpAuthClientAtom extends AtomHttpApi.Tag<HttpAuthClientAtom>()(
  'HttpAuthClientAtom',
  {
    api: AuthApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: process.env.API_URL!,
  }
) {}
