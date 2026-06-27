import type { HealthlogDatabase } from "../db/database.js";
import { getProviderState } from "../db/provider-state.js";
import type { ProviderSyncResult } from "../domain/provider.js";
import { syncGarmin } from "../providers/garmin/sync.js";
import { syncHevy } from "../providers/hevy/sync.js";
import { logger } from "../utils/logger.js";

export async function syncConfiguredProviders(
  db: HealthlogDatabase,
): Promise<ProviderSyncResult> {
  let totalNewWorkoutCount = 0;
  let configuredProviderCount = 0;

  const garminState = getProviderState(db, "garmin");
  if (garminState && garminState.credentialsJson.trim() !== "") {
    configuredProviderCount += 1;
    logger.info("Syncing Garmin...");
    const result = await syncGarmin(db, garminState);
    totalNewWorkoutCount += result.newWorkoutCount;
    logger.success(
      `Garmin sync done: ${formatWorkoutCount(result.newWorkoutCount)}.`,
    );
  }

  const hevyState = getProviderState(db, "hevy");
  if (hevyState && hevyState.credentialsJson.trim() !== "") {
    configuredProviderCount += 1;
    logger.info("Syncing Hevy...");
    const result = await syncHevy(db, hevyState);
    totalNewWorkoutCount += result.newWorkoutCount;
    logger.success(
      `Hevy sync done: ${formatWorkoutCount(result.newWorkoutCount)}.`,
    );
  }

  if (configuredProviderCount === 0) {
    logger.info("No providers configured; skipping sync.");
  }

  return { newWorkoutCount: totalNewWorkoutCount };
}

function formatWorkoutCount(count: number): string {
  return `${count} new ${count === 1 ? "workout" : "workouts"}`;
}
