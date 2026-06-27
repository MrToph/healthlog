import { optionalFiniteNumber, parseSchema } from "../../utils/parse.js";
import type { GarminClient } from "./client.js";
import type {
  GarminApiActivity,
  GarminApiExercise,
  GarminApiExerciseSet,
  GarminApiExerciseSetsResponse,
  GarminExercise,
  GarminExerciseSetsResponse,
  GarminWorkoutSource,
} from "./types.js";
import { GarminExerciseSetsResponseSchema } from "./types.js";

export async function fetchFullGarminWorkout(
  client: GarminClient,
  activity: GarminApiActivity,
): Promise<GarminWorkoutSource> {
  const details = await client.getActivityDetails(activity.activityId);
  const exerciseSets = normalizeExerciseSetsResponse(
    await client.getExerciseSets(activity.activityId),
  );

  return {
    activity,
    details,
    exerciseSets,
  };
}

export function normalizeExerciseSetsResponse(
  response: GarminApiExerciseSetsResponse,
): GarminExerciseSetsResponse {
  return parseSchema(
    GarminExerciseSetsResponseSchema,
    {
      ...response,
      exerciseSets: (response.exerciseSets ?? []).map((set, sourceIndex) =>
        normalizeApiExerciseSet(set, sourceIndex),
      ),
    },
    "normalized Garmin exercise sets",
  );
}

function normalizeApiExerciseSet(
  set: GarminApiExerciseSet,
  sourceIndex: number,
): GarminExerciseSetsResponse["exerciseSets"][number] {
  const repetitionCount = optionalFiniteNumber(set.repetitionCount);
  const weight = optionalFiniteNumber(set.weight);
  const wktStepIndex = optionalFiniteNumber(set.wktStepIndex);

  return {
    ...set,
    exercises: (set.exercises ?? []).map(normalizeApiExercise),
    duration: set.duration,
    ...(repetitionCount === undefined ? {} : { repetitionCount }),
    ...(weight === undefined ? {} : { weight }),
    setType: set.setType,
    startTime: set.startTime,
    ...(wktStepIndex === undefined ? {} : { wktStepIndex }),
    setIndex: optionalFiniteNumber(set.messageIndex) ?? sourceIndex,
  };
}

function normalizeApiExercise(exercise: GarminApiExercise): GarminExercise {
  return {
    ...exercise,
    category:
      typeof exercise.category === "string" && exercise.category.length > 0
        ? exercise.category
        : "Unknown",
    name:
      typeof exercise.name === "string" && exercise.name.length > 0
        ? exercise.name
        : "Unknown",
    probability:
      typeof exercise.probability === "number" &&
      Number.isFinite(exercise.probability)
        ? exercise.probability
        : 0,
  };
}
