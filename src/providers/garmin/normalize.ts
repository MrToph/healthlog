import type {
  ActivityMetric,
  StartLocation,
  StrengthExercise,
  StrengthMetricsRow,
  Workout,
  WorkoutType,
  WorkoutWithMetrics,
} from "../../domain/workout.js";
import {
  ActivityMetricsSchema,
  StrengthExercisesSchema,
} from "../../domain/workout.js";
import {
  metricNumber,
  optionalFiniteNumber,
  parseSchema,
  stringifyJson,
} from "../../utils/parse.js";
import { speedToPaceMinutesPerKilometer } from "../../utils/running.js";
import type { GarminExerciseSet, GarminWorkoutSource } from "./types.js";

export function normalizeGarminWorkoutSource(
  source: GarminWorkoutSource,
): WorkoutWithMetrics {
  const activity = source.activity;
  const activityId = activity.activityId;
  const sport = activity.activityType.typeKey;
  const startedAtMs = parseGarminGmtTimestamp(activity.startTimeGMT);
  const durationSeconds = metricNumber(activity.duration);
  const endedAtMs = startedAtMs + durationSeconds * 1000;
  const type = garminWorkoutType(sport);
  const workoutId = `garmin:${activityId}`;
  const workout = {
    id: workoutId,
    provider: "garmin",
    providerId: String(activityId),
    type,
    sport,
    title: activity.activityName,
    startedAtMs,
    endedAtMs,
    sourceJson: stringifyJson(source),
    providerExtrasJson: garminProviderExtrasJson(type, source),
  } satisfies Workout;

  if (type === "endurance") {
    return {
      type: "endurance",
      workout: { ...workout, type: "endurance" },
      enduranceMetrics: {
        workoutId,
        durationSeconds,
        distanceMeters: metricNumber(activity.distance),
        elevationGainMeters: metricNumber(activity.elevationGain),
        elevationLossMeters: metricNumber(activity.elevationLoss),
        startLocation: garminStartLocation(
          activity.startLatitude,
          activity.startLongitude,
        ),
        calories: metricNumber(activity.calories),
        averageHeartRate: metricNumber(activity.averageHR),
        maxHeartRate: metricNumber(activity.maxHR),
        averageRunningCadenceStepsPerMinute: metricNumber(
          activity.averageRunningCadenceInStepsPerMinute,
        ),
        averageStrideLengthCentimeters: metricNumber(activity.avgStrideLength),
        averagePaceMinutesPerKilometer: speedToPaceMinutesPerKilometer(
          metricNumber(activity.averageSpeed),
        ),
        fastestPaceMinutesPerKilometer: speedToPaceMinutesPerKilometer(
          metricNumber(activity.maxSpeed),
        ),
        activityMetricsJson: stringifyJson(
          parseSchema(
            ActivityMetricsSchema,
            extractActivityMetrics(source),
            "Garmin activity metrics",
          ),
        ),
      },
    };
  }

  return {
    type: "strength",
    workout: { ...workout, type: "strength" },
    strengthMetrics: normalizeGarminStrengthMetrics(
      workoutId,
      source.exerciseSets.exerciseSets,
    ),
  };
}

function normalizeGarminStrengthMetrics(
  workoutId: string,
  exerciseSets: GarminExerciseSet[],
): StrengthMetricsRow {
  const exerciseGroups = new Map<number, StrengthExercise>();

  for (const set of exerciseSets) {
    if (set.setType === "REST") {
      continue;
    }

    const exerciseIndex =
      optionalFiniteNumber(set.wktStepIndex) ?? set.setIndex;
    const existing = exerciseGroups.get(exerciseIndex);
    const exercise =
      existing ??
      ({
        title: bestExerciseName(set),
        sets: [],
      } satisfies StrengthExercise);

    exercise.sets.push({
      weightKg: garminWeightKg(set.weight),
      reps: metricNumber(set.repetitionCount),
      durationSeconds: metricNumber(set.duration),
    });

    exerciseGroups.set(exerciseIndex, exercise);
  }

  const exercises = [...exerciseGroups.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, exercise]) => exercise);

  return {
    workoutId,
    exercisesJson: stringifyJson(
      parseSchema(
        StrengthExercisesSchema,
        exercises,
        "Garmin strength metrics",
      ),
    ),
  };
}

function bestExerciseName(set: GarminExerciseSet): string {
  const exercises = set.exercises;
  if (exercises.length === 0) {
    return "Unknown";
  }

  const sorted = [...exercises].sort((a, b) => b.probability - a.probability);
  const best = sorted[0];
  return best && best.name.length > 0 ? best.name : "Unknown";
}

function garminWorkoutType(sport: string): WorkoutType {
  return sport.toLowerCase().includes("strength") ? "strength" : "endurance";
}

function garminProviderExtrasJson(
  type: WorkoutType,
  source: GarminWorkoutSource,
): string | null {
  const activity = source.activity;
  if (type === "strength") {
    return stringifyJson({
      calories: metricNumber(activity.calories),
      averageHeartRate: metricNumber(activity.averageHR),
      maxHeartRate: metricNumber(activity.maxHR),
    });
  }

  return null;
}

function extractActivityMetrics(source: GarminWorkoutSource): ActivityMetric[] {
  const heartRateDescriptor = source.details.metricDescriptors.find(
    (descriptor) => descriptor.key === "directHeartRate",
  );
  const elapsedDescriptor = source.details.metricDescriptors.find(
    (descriptor) => descriptor.key === "sumElapsedDuration",
  );
  const speedDescriptor = source.details.metricDescriptors.find(
    (descriptor) => descriptor.key === "directSpeed",
  );

  if (!heartRateDescriptor || !elapsedDescriptor) {
    return [];
  }

  const activityMetrics: ActivityMetric[] = [];
  for (const metric of source.details.activityDetailMetrics) {
    const heartRate = metric.metrics[heartRateDescriptor.metricsIndex];
    const secondsElapsed = metric.metrics[elapsedDescriptor.metricsIndex];
    if (typeof heartRate === "number" && typeof secondsElapsed === "number") {
      const speed =
        speedDescriptor === undefined
          ? 0
          : metricNumber(metric.metrics[speedDescriptor.metricsIndex]);
      activityMetrics.push([
        secondsElapsed,
        heartRate,
        speedToPaceMinutesPerKilometer(speed),
      ]);
    }
  }

  return activityMetrics;
}

function parseGarminGmtTimestamp(value: string): number {
  const ms = Date.parse(`${value.replace(" ", "T")}Z`);
  if (!Number.isFinite(ms)) {
    throw new Error(`Invalid Garmin GMT timestamp "${value}"`);
  }
  return ms;
}

function garminWeightKg(value: number | null | undefined): number {
  return metricNumber(value) / 1000;
}

function garminStartLocation(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): StartLocation | null {
  const startLatitude = optionalFiniteNumber(latitude);
  const startLongitude = optionalFiniteNumber(longitude);
  return startLatitude === undefined || startLongitude === undefined
    ? null
    : [startLatitude, startLongitude];
}
