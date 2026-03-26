/** Wrap plain DB rows as Schema.Class instances for RPC/HTTP responses */

import { Drill } from "@laxdb/core-v2/drill/drill.schema";
import { Player } from "@laxdb/core-v2/player/player.schema";
import {
  Practice,
  PracticeItem,
  PracticeReview,
} from "@laxdb/core-v2/practice/practice.schema";

export const asDrill = (row: typeof Drill.Type) => new Drill(row);
export const asPlayer = (row: typeof Player.Type) => new Player(row);
export const asPractice = (row: typeof Practice.Type) => new Practice(row);
export const asPracticeItem = (row: typeof PracticeItem.Type) =>
  new PracticeItem(row);
export const asPracticeReview = (row: typeof PracticeReview.Type) =>
  new PracticeReview(row);
