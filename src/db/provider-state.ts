import type { Provider } from "../domain/provider.js";
import type { HealthlogDatabase } from "./database.js";

export type ProviderState = {
  provider: Provider;
  credentialsJson: string;
  cursorJson: string;
  lastSyncedAtMs: number | null;
  updatedAtMs: number;
};

type ProviderDbRow = {
  provider: Provider;
  credentials_json: string;
  cursor_json: string;
  last_synced_at_ms: number | null;
  updated_at_ms: number;
};

export function getProviderState(
  db: HealthlogDatabase,
  provider: Provider,
): ProviderState | null {
  const row = db
    .prepare(
      "SELECT provider, credentials_json, cursor_json, last_synced_at_ms, updated_at_ms FROM provider_state WHERE provider = ?",
    )
    .get(provider) as ProviderDbRow | undefined;

  return row ? mapProviderDbRow(row) : null;
}

export function upsertProviderState(
  db: HealthlogDatabase,
  provider: Provider,
  credentialsJson: string,
  cursorJson: string,
  lastSyncedAtMs: number | null,
): void {
  const updatedAtMs = Date.now();
  db.prepare(`
    INSERT INTO provider_state (provider, credentials_json, cursor_json, last_synced_at_ms, updated_at_ms)
    VALUES (@provider, @credentialsJson, @cursorJson, @lastSyncedAtMs, @updatedAtMs)
    ON CONFLICT(provider) DO UPDATE SET
      credentials_json = excluded.credentials_json,
      cursor_json = excluded.cursor_json,
      last_synced_at_ms = excluded.last_synced_at_ms,
      updated_at_ms = excluded.updated_at_ms
  `).run({
    provider,
    credentialsJson,
    cursorJson,
    lastSyncedAtMs,
    updatedAtMs,
  });
}

export function updateProviderCursor(
  db: HealthlogDatabase,
  provider: Provider,
  cursorJson: string,
  lastSyncedAtMs: number,
): void {
  const result = db
    .prepare(`
      UPDATE provider_state
      SET cursor_json = @cursorJson,
        last_synced_at_ms = @lastSyncedAtMs,
        updated_at_ms = @updatedAtMs
      WHERE provider = @provider
    `)
    .run({ provider, cursorJson, lastSyncedAtMs, updatedAtMs: Date.now() });

  if (result.changes !== 1) {
    throw new Error(
      `Cannot update ${provider} cursor because provider is not configured`,
    );
  }
}

function mapProviderDbRow(row: ProviderDbRow): ProviderState {
  return {
    provider: row.provider,
    credentialsJson: row.credentials_json,
    cursorJson: row.cursor_json,
    lastSyncedAtMs: row.last_synced_at_ms,
    updatedAtMs: row.updated_at_ms,
  };
}
