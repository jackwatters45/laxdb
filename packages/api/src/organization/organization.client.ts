import { AtomHttpApi, AtomRpc } from "@effect-atom/atom-react";
import { FetchHttpClient } from "@effect/platform";
import { RpcClient } from "@effect/rpc";
import { Env } from "@laxdb/core/config";
import { Effect } from "effect";

import { RpcProtocolLive } from "../protocol";

import { OrganizationsApi } from "./organization.api";
import { OrganizationRpcs } from "./organization.rpc";

export class RpcOrganizationClient extends Effect.Service<RpcOrganizationClient>()(
  "RpcOrganizationClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(OrganizationRpcs),
  },
) {}

export class RpcOrganizationClientAtom extends AtomRpc.Tag<RpcOrganizationClientAtom>()(
  "RpcOrganizationClientAtom",
  {
    group: OrganizationRpcs,
    protocol: RpcProtocolLive,
  },
) {}

export class HttpOrganizationClientAtom extends AtomHttpApi.Tag<HttpOrganizationClientAtom>()(
  "HttpOrganizationClientAtom",
  {
    api: OrganizationsApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: Env.API_URL(),
  },
) {}
