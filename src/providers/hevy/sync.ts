import type { HealthlogDatabase } from "../../db/database.js";
import {
  type ProviderState,
  updateProviderCursor,
} from "../../db/provider-state.js";
import { upsertNormalizedWorkout } from "../../db/workouts.js";
import type { ProviderSyncResult } from "../../domain/provider.js";
import { parseJson, parseSchema, stringifyJson } from "../../utils/parse.js";
import { HevyClient } from "./client.js";
import { normalizeHevyWorkoutSource } from "./normalize.js";
import { buildHevyWorkoutSource } from "./source.js";
import type {
  HevyApiWorkoutEvent,
  HevyCredentials,
  HevyCursor,
} from "./types.js";
import { HevyCredentialsSchema, HevyCursorSchema } from "./types.js";

export async function syncHevy(
  db: HealthlogDatabase,
  state: ProviderState,
): Promise<ProviderSyncResult> {
  const credentials = parseHevyCredentials(state.credentialsJson);
  const cursor = parseHevyCursor(state.cursorJson);
  const client = HevyClient.fromCredentials(credentials);
  const events = sortEventsByTimestampAsc(
    await getEventsToSync(client, cursor.since),
  );

  let newWorkoutCount = 0;
  let nextSince = cursor.since;

  const transaction = db.transaction(() => {
    for (const event of events) {
      nextSince = maxIsoTimestamp(nextSince, eventTimestamp(event));

      if (event.type === "deleted") {
        continue;
      }

      const source = buildHevyWorkoutSource(event.workout);
      const rows = normalizeHevyWorkoutSource(source);
      if (upsertNormalizedWorkout(db, rows)) {
        newWorkoutCount += 1;
      }
    }

    updateProviderCursor(
      db,
      "hevy",
      stringifyJson({
        version: 1,
        since: nextSince,
      } satisfies HevyCursor),
      Date.now(),
    );
  });

  transaction();
  return { newWorkoutCount };
}

async function getEventsToSync(
  client: HevyClient,
  since: string,
): Promise<HevyApiWorkoutEvent[]> {
  const events: HevyApiWorkoutEvent[] = [];
  let page = 1;

  while (true) {
    const response = await client.getWorkoutEvents(since, page);
    events.push(...response.events);

    if (response.page >= response.page_count) {
      return events;
    }

    page += 1;
  }
}

function sortEventsByTimestampAsc(
  events: HevyApiWorkoutEvent[],
): HevyApiWorkoutEvent[] {
  // Hevy returns events newest-first; writing oldest-first keeps the newest
  // duplicate workout event as the final local version.
  return [...events].sort(
    (left, right) => eventSortTimestamp(left) - eventSortTimestamp(right),
  );
}

function eventSortTimestamp(event: HevyApiWorkoutEvent): number {
  const timestamp = eventTimestamp(event);
  if (timestamp === null) {
    return Number.NEGATIVE_INFINITY;
  }

  return parseIsoTimestamp(timestamp);
}

function eventTimestamp(event: HevyApiWorkoutEvent): string | null {
  if (event.type === "updated") {
    return event.workout.updated_at;
  }

  return event.deleted_at ?? null;
}

function maxIsoTimestamp(left: string, right: string | null): string {
  if (right === null) {
    return left;
  }

  const leftMs = parseIsoTimestamp(left);
  const rightMs = parseIsoTimestamp(right);
  return rightMs > leftMs ? right : left;
}

function parseIsoTimestamp(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new Error(`Invalid Hevy cursor timestamp "${value}"`);
  }
  return ms;
}

function parseHevyCredentials(json: string): HevyCredentials {
  return parseSchema(
    HevyCredentialsSchema,
    parseJson(json, "hevy credentials_json"),
    "Hevy credentials",
  );
}

function parseHevyCursor(json: string): HevyCursor {
  const cursor = parseSchema(
    HevyCursorSchema,
    parseJson(json, "hevy cursor_json"),
    "Hevy cursor",
  );
  parseIsoTimestamp(cursor.since);
  return cursor;
}
