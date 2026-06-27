import { resolveDatabasePath } from "../config/database-path.js";
import { openDatabase } from "../db/database.js";
import { getProviderState } from "../db/provider-state.js";
import type { Provider } from "../domain/provider.js";

export function readIntegrationCredentialsJson(provider: Provider): string {
  const databasePath = resolveDatabasePath({});
  const db = openDatabase(databasePath);
  try {
    const state = getProviderState(db, provider);
    if (!state || state.credentialsJson.trim() === "") {
      throw new Error(
        `Missing ${provider} credentials in ${databasePath}. Run healthlog setup ${provider} first, or set HEALTHLOG_DB_PATH to a configured database.`,
      );
    }

    return state.credentialsJson;
  } finally {
    db.close();
  }
}

export const describeIntegration =
  process.env.HEALTHLOG_INTEGRATION === "1" ? describe : describe.skip;
