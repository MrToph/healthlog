import type {
  StrengthExercise,
  WorkoutWithMetrics,
} from "../../domain/workout.js";
import { StrengthExercisesSchema } from "../../domain/workout.js";
import { metricNumber, parseSchema, stringifyJson } from "../../utils/parse.js";
import type { HevyWorkoutSource } from "./types.js";

export function normalizeHevyWorkoutSource(
  source: HevyWorkoutSource,
): WorkoutWithMetrics {
  const workout = source.workout;
  const workoutId = `hevy:${workout.id}`;

  return {
    type: "strength",
    workout: {
      id: workoutId,
      provider: "hevy",
      providerId: workout.id,
      type: "strength",
      sport: "strength_training",
      title: workout.title,
      startedAtMs: parseHevyTimestamp(workout.start_time, "start_time"),
      endedAtMs:
        workout.end_time === null
          ? null
          : parseHevyTimestamp(workout.end_time, "end_time"),
      sourceJson: stringifyJson(source),
      providerExtrasJson: null,
    },
    strengthMetrics: {
      workoutId,
      exercisesJson: stringifyJson(
        parseSchema(
          StrengthExercisesSchema,
          normalizeHevyExercises(source),
          "Hevy strength metrics",
        ),
      ),
    },
  };
}

function normalizeHevyExercises(source: HevyWorkoutSource): StrengthExercise[] {
  return [...source.workout.exercises]
    .sort((left, right) => left.index - right.index)
    .map((exercise) => ({
      title: exercise.title,
      sets: [...exercise.sets]
        .sort((left, right) => left.index - right.index)
        .map((set) => ({
          weightKg: metricNumber(set.weight_kg),
          reps: metricNumber(set.reps),
          durationSeconds: metricNumber(set.duration_seconds),
        })),
    }));
}

function parseHevyTimestamp(value: string, label: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new Error(`Invalid Hevy ${label} timestamp "${value}"`);
  }
  return ms;
}
