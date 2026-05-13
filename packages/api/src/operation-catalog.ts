import { DefaultsRpcNames } from "./defaults/defaults.operations";
import { DrillRpcNames } from "./drill/drill.operations";
import { PlayRpcNames } from "./play/play.operations";
import { PlayerRpcNames } from "./player/player.operations";
import { PracticeRpcNames } from "./practice/practice.operations";

export const ApiRpcNames = [
  ...DefaultsRpcNames,
  ...DrillRpcNames,
  ...PlayRpcNames,
  ...PlayerRpcNames,
  ...PracticeRpcNames,
].toSorted((a, b) => a.localeCompare(b));
