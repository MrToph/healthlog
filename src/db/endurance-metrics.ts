import type { EnduranceMetricsRow } from "../domain/workout.js";
import { stringifyJson } from "../utils/parse.js";
import type { HealthlogDatabase } from "./database.js";

export function insertEnduranceMetrics(
  db: HealthlogDatabase,
  metrics: EnduranceMetricsRow,
): void {
  db.prepare(`
    INSERT INTO endurance_metrics (
      workout_id,
      duration_seconds,
      distance_meters,
      elevation_gain_meters,
      elevation_loss_meters,
      start_location_json,
      calories,
      avg_hr,
      max_hr,
      avg_running_cadence_spm,
      avg_stride_length_cm,
      avg_pace_min_per_km,
      fastest_pace_min_per_km,
      activity_metrics_json
    )
    VALUES (
      @workoutId,
      @durationSeconds,
      @distanceMeters,
      @elevationGainMeters,
      @elevationLossMeters,
      @startLocationJson,
      @calories,
      @averageHeartRate,
      @maxHeartRate,
      @averageRunningCadenceStepsPerMinute,
      @averageStrideLengthCentimeters,
      @averagePaceMinutesPerKilometer,
      @fastestPaceMinutesPerKilometer,
      @activityMetricsJson
    )
  `).run({
    ...metrics,
    startLocationJson:
      metrics.startLocation === null
        ? null
        : stringifyJson(metrics.startLocation),
  });
}
