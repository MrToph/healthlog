import type { HealthlogDatabase } from "../../db/database.js";
import {
  type ProviderState,
  updateProviderCursor,
} from "../../db/provider-state.js";
import { upsertNormalizedWorkout } from "../../db/workouts.js";
import type { ProviderSyncResult } from "../../domain/provider.js";
import { logger } from "../../utils/logger.js";
import { parseJson, parseSchema, stringifyJson } from "../../utils/parse.js";
import { GarminClient } from "./client.js";
import { normalizeGarminWorkoutSource } from "./normalize.js";
import { fetchFullGarminWorkout } from "./source.js";
import type {
  GarminApiActivity,
  GarminCursor,
  GarminTokens,
  GarminWorkoutSource,
} from "./types.js";
import { GarminCursorSchema, GarminTokensSchema } from "./types.js";

const batchSize = 100;

export async function syncGarmin(
  db: HealthlogDatabase,
  state: ProviderState,
): Promise<ProviderSyncResult> {
  const tokens = parseGarminTokens(state.credentialsJson);
  const cursor = parseGarminCursor(state.cursorJson);
  const client = GarminClient.fromTokens(tokens);
  const newActivities = await getActivitiesToSync(
    client,
    cursor.highestSyncedActivityId,
  );
  const sortedNewActivities = [...newActivities].sort(
    (a, b) => a.activityId - b.activityId,
  );
  if (sortedNewActivities.length > 0) {
    logger.info(
      `Garmin found ${formatWorkoutCount(sortedNewActivities.length)} to sync.`,
    );
  }
  let newWorkoutCount = 0;
  let highestSyncedActivityId = cursor.highestSyncedActivityId;

  const fullWorkoutByActivityId = new Map<number, GarminWorkoutSource>();
  for (const [index, activity] of sortedNewActivities.entries()) {
    logger.debug(
      `Garmin fetching ${index + 1}/${sortedNewActivities.length}: ${activity.activityName}`,
    );
    fullWorkoutByActivityId.set(
      activity.activityId,
      await fetchFullGarminWorkout(client, activity),
    );
  }

  const transaction = db.transaction(() => {
    for (const activity of sortedNewActivities) {
      const fullWorkout = fullWorkoutByActivityId.get(activity.activityId);
      if (!fullWorkout) {
        throw new Error(
          `Missing full Garmin workout for activity ${activity.activityId}`,
        );
      }
      const rows = normalizeGarminWorkoutSource(fullWorkout);
      if (upsertNormalizedWorkout(db, rows)) {
        newWorkoutCount += 1;
      }
      highestSyncedActivityId = Math.max(
        highestSyncedActivityId,
        activity.activityId,
      );
    }

    updateProviderCursor(
      db,
      "garmin",
      stringifyJson({
        version: 1,
        highestSyncedActivityId,
      } satisfies GarminCursor),
      Date.now(),
    );
  });

  transaction();
  return { newWorkoutCount };
}

function formatWorkoutCount(count: number): string {
  return `${count} new ${count === 1 ? "workout" : "workouts"}`;
}

async function getActivitiesToSync(
  client: GarminClient,
  highestSyncedActivityId: number,
): Promise<GarminApiActivity[]> {
  const activities: GarminApiActivity[] = [];
  let start = 0;

  while (true) {
    const batch = await client.getActivities(start, batchSize);
    const lastSyncedIndex = batch.findIndex(
      (activity) => activity.activityId <= highestSyncedActivityId,
    );

    if (lastSyncedIndex !== -1) {
      activities.push(...batch.slice(0, lastSyncedIndex));
      return activities;
    }

    activities.push(...batch);

    if (batch.length < batchSize) {
      return activities;
    }

    start += batchSize;
  }
}

function parseGarminTokens(json: string): GarminTokens {
  return parseSchema(
    GarminTokensSchema,
    parseJson(json, "garmin credentials_json"),
    "Garmin credentials",
  );
}

function parseGarminCursor(json: string): GarminCursor {
  return parseSchema(
    GarminCursorSchema,
    parseJson(json, "garmin cursor_json"),
    "Garmin cursor",
  );
}
