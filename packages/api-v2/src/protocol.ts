import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Env } from "@laxdb/core-v2/config";
import { Layer } from "effect";

export const makeRpcProtocol = (apiUrl: string) =>
  RpcClient.layerProtocolHttp({
    url: `${apiUrl}/rpc`,
  }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export const RpcProtocolLive = makeRpcProtocol(Env.API_URL());
