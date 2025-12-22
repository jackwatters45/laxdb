import { Atom } from '@effect-atom/atom-react';
import { RpcClientLive } from '@laxdb/api/client';

export const RuntimeAtom = Atom.runtime(RpcClientLive);

// adding global layers
// import { ConfigProvider, Layer } from "effect"

// Atom.runtime.addGlobalLayer(
//   Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env)),
// )
