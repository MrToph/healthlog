import type { HealthlogDatabase } from "../db/database.js";
import { upsertProviderState } from "../db/provider-state.js";
import type { GarminTokens } from "../providers/garmin/types.js";
import { initialGarminCursor } from "../providers/garmin/types.js";
import { initialHevyCursor } from "../providers/hevy/types.js";
import { stringifyJson } from "../utils/parse.js";

export function storeGarminCredentials(
  db: HealthlogDatabase,
  tokens: GarminTokens,
): void {
  upsertProviderState(
    db,
    "garmin",
    stringifyJson(tokens),
    stringifyJson(initialGarminCursor),
    null,
  );
}

export function storeHevyCredentials(
  db: HealthlogDatabase,
  apiKey: string,
): void {
  upsertProviderState(
    db,
    "hevy",
    stringifyJson({ apiKey }),
    stringifyJson(initialHevyCursor),
    null,
  );
}
