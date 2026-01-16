import { HttpApi } from "@effect/platform";
import { SeasonsGroup } from "./season/season.api";

// Unified API definition - groups added as they are migrated
export class LaxdbApi extends HttpApi.make("LaxdbApi").add(SeasonsGroup) {}
