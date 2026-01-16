import { AtomHttpApi, AtomRpc } from "@effect-atom/atom-react";
import { FetchHttpClient } from "@effect/platform";
import { RpcClient } from "@effect/rpc";
import { Env } from "@laxdb/core/config";
import { Effect } from "effect";

import { RpcProtocolLive } from "../../protocol";

import { ContactInfoApi } from "./contact-info.api";
import { ContactInfoRpcs } from "./contact-info.rpc";

export class RpcContactInfoClient extends Effect.Service<RpcContactInfoClient>()(
  "RpcContactInfoClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(ContactInfoRpcs),
  },
) {}

export class RpcContactInfoClientAtom extends AtomRpc.Tag<RpcContactInfoClientAtom>()(
  "RpcContactInfoClientAtom",
  {
    group: ContactInfoRpcs,
    protocol: RpcProtocolLive,
  },
) {}

export class HttpContactInfoClientAtom extends AtomHttpApi.Tag<HttpContactInfoClientAtom>()(
  "HttpContactInfoClientAtom",
  {
    api: ContactInfoApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: Env.API_URL(),
  },
) {}
