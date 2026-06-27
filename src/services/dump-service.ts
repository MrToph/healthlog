import type { HealthlogDatabase } from "../db/database.js";
import { getWorkoutsWithMetrics } from "../db/workouts.js";
import type { DumpDocument, DumpWorkout } from "../domain/dump.js";
import type { ActivityMetric, StrengthExercise } from "../domain/workout.js";
import {
  ActivityMetricsSchema,
  StrengthExercisesSchema,
} from "../domain/workout.js";
import type { DateRange } from "../utils/dates.js";
import { parseJson, parseSchema } from "../utils/parse.js";

export function buildDumpDocument(
  db: HealthlogDatabase,
  range: DateRange,
): DumpDocument {
  const workoutsWithMetrics = getWorkoutsWithMetrics(db, range);

  return {
    generatedAt: new Date().toISOString(),
    range: {
      from: range.from,
      to: range.to,
    },
    workouts: workoutsWithMetrics.map((workoutWithMetrics): DumpWorkout => {
      const workout = workoutWithMetrics.workout;
      if (workoutWithMetrics.type === "endurance") {
        const metrics = workoutWithMetrics.enduranceMetrics;
        return {
          id: workout.id,
          provider: workout.provider,
          providerId: workout.providerId,
          type: "endurance",
          sport: workout.sport,
          title: workout.title,
          startedAt: new Date(workout.startedAtMs).toISOString(),
          endedAt:
            workout.endedAtMs === null
              ? null
              : new Date(workout.endedAtMs).toISOString(),
          providerExtras: parseProviderExtrasJson(
            workout.providerExtrasJson,
            workout.id,
          ),
          durationSeconds: metrics.durationSeconds,
          distanceMeters: metrics.distanceMeters,
          elevationGainMeters: metrics.elevationGainMeters,
          elevationLossMeters: metrics.elevationLossMeters,
          startLocation: metrics.startLocation,
          calories: metrics.calories,
          averageHeartRate: metrics.averageHeartRate,
          maxHeartRate: metrics.maxHeartRate,
          averageRunningCadenceStepsPerMinute:
            metrics.averageRunningCadenceStepsPerMinute,
          averageStrideLengthCentimeters:
            metrics.averageStrideLengthCentimeters,
          averagePaceMinutesPerKilometer:
            metrics.averagePaceMinutesPerKilometer,
          fastestPaceMinutesPerKilometer:
            metrics.fastestPaceMinutesPerKilometer,
          activityMetrics: parseActivityMetrics(
            metrics.activityMetricsJson,
            workout.id,
          ),
        };
      }

      return {
        id: workout.id,
        provider: workout.provider,
        providerId: workout.providerId,
        type: "strength",
        sport: workout.sport,
        title: workout.title,
        startedAt: new Date(workout.startedAtMs).toISOString(),
        endedAt:
          workout.endedAtMs === null
            ? null
            : new Date(workout.endedAtMs).toISOString(),
        providerExtras: parseProviderExtrasJson(
          workout.providerExtrasJson,
          workout.id,
        ),
        exercises: parseStrengthExercises(
          workoutWithMetrics.strengthMetrics.exercisesJson,
          workout.id,
        ),
      };
    }),
  };
}

function parseProviderExtrasJson(
  providerExtrasJson: string | null,
  workoutId: string,
): unknown | null {
  return providerExtrasJson === null
    ? null
    : parseJson(providerExtrasJson, `provider_extras_json for ${workoutId}`);
}

function parseStrengthExercises(
  exercisesJson: string,
  workoutId: string,
): StrengthExercise[] {
  return parseSchema(
    StrengthExercisesSchema,
    parseJson(exercisesJson, `strength metrics for ${workoutId}`),
    `strength metrics for workout ${workoutId}`,
  );
}

function parseActivityMetrics(
  activityMetricsJson: string,
  workoutId: string,
): ActivityMetric[] {
  return parseSchema(
    ActivityMetricsSchema,
    parseJson(activityMetricsJson, `activity_metrics_json for ${workoutId}`),
    `activity metrics for workout ${workoutId}`,
  );
}
