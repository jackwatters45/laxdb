import { Env } from "@laxdb/core-v2/config";
import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

export const makeRpcProtocol = (apiUrl: string) =>
  RpcClient.layerProtocolHttp({
    url: `${apiUrl}/rpc`,
  }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export const RpcProtocolLive = makeRpcProtocol(Env.API_URL());
