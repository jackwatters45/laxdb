import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

export const makeRpcProtocol = (apiUrl: string) =>
  RpcClient.layerProtocolHttp({
    url: `${apiUrl}/rpc`,
  }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));
