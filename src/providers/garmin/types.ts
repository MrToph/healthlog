import type { IGarminTokens } from "garmin-connect/dist/garmin/types.js";
import { z } from "zod";

const finiteNumber = z.number();
const optionalFiniteNumber = finiteNumber.nullish();

export type GarminTokens = IGarminTokens;

export const GarminTokensSchema = z
  .object({
    oauth1: z
      .object({
        oauth_token: z.string().min(1),
        oauth_token_secret: z.string().min(1),
      })
      .strict(),
    oauth2: z
      .object({
        scope: z.string().min(1),
        jti: z.string().min(1),
        access_token: z.string().min(1),
        token_type: z.string().min(1),
        refresh_token: z.string().min(1),
        expires_in: finiteNumber,
        refresh_token_expires_in: finiteNumber,
        expires_at: finiteNumber,
        refresh_token_expires_at: finiteNumber,
        last_update_date: z.string().min(1),
        expires_date: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const GarminApiActivityTypeSchema = z.looseObject({
  typeKey: z.string().min(1),
});

export const GarminApiActivitySchema = z.looseObject({
  activityId: finiteNumber,
  activityName: z.string().min(1),
  startTimeGMT: z.string().min(1),
  activityType: GarminApiActivityTypeSchema,
  duration: optionalFiniteNumber,
  distance: optionalFiniteNumber,
  elevationGain: optionalFiniteNumber,
  elevationLoss: optionalFiniteNumber,
  startLatitude: optionalFiniteNumber,
  startLongitude: optionalFiniteNumber,
  calories: optionalFiniteNumber,
  averageHR: optionalFiniteNumber,
  maxHR: optionalFiniteNumber,
  averageRunningCadenceInStepsPerMinute: optionalFiniteNumber,
  avgStrideLength: optionalFiniteNumber,
  averageSpeed: optionalFiniteNumber,
  maxSpeed: optionalFiniteNumber,
});

export const GarminApiActivitiesSchema = z.array(GarminApiActivitySchema);

export type GarminApiActivity = z.infer<typeof GarminApiActivitySchema>;

export const GarminApiExerciseSchema = z.looseObject({
  category: z.string().nullish(),
  name: z.string().nullish(),
  probability: optionalFiniteNumber,
});

export type GarminApiExercise = z.infer<typeof GarminApiExerciseSchema>;

export const GarminApiExerciseSetSchema = z.looseObject({
  exercises: z.array(GarminApiExerciseSchema).nullish(),
  duration: optionalFiniteNumber,
  repetitionCount: optionalFiniteNumber,
  weight: optionalFiniteNumber,
  setType: z.string().nullish(),
  startTime: z.string().nullish(),
  wktStepIndex: optionalFiniteNumber,
  messageIndex: optionalFiniteNumber,
});

export type GarminApiExerciseSet = z.infer<typeof GarminApiExerciseSetSchema>;

export const GarminApiExerciseSetsResponseSchema = z.looseObject({
  activityId: finiteNumber,
  exerciseSets: z.array(GarminApiExerciseSetSchema).nullable(),
});

export type GarminApiExerciseSetsResponse = z.infer<
  typeof GarminApiExerciseSetsResponseSchema
>;

export const GarminExerciseSchema = z.looseObject({
  category: z.string().min(1),
  name: z.string().min(1),
  probability: finiteNumber,
});

export type GarminExercise = z.infer<typeof GarminExerciseSchema>;

export const GarminExerciseSetSchema = z.looseObject({
  exercises: z.array(GarminExerciseSchema),
  duration: optionalFiniteNumber,
  repetitionCount: optionalFiniteNumber,
  weight: optionalFiniteNumber,
  setType: z.string().nullish(),
  startTime: z.string().nullish(),
  wktStepIndex: optionalFiniteNumber,
  setIndex: finiteNumber,
});

export type GarminExerciseSet = z.infer<typeof GarminExerciseSetSchema>;

export const GarminExerciseSetsResponseSchema = z.looseObject({
  activityId: finiteNumber,
  exerciseSets: z.array(GarminExerciseSetSchema),
});

export type GarminExerciseSetsResponse = z.infer<
  typeof GarminExerciseSetsResponseSchema
>;

export const GarminUnitSchema = z.looseObject({
  id: finiteNumber,
  key: z.string(),
  factor: finiteNumber,
});

export const GarminMetricDescriptorSchema = z.looseObject({
  metricsIndex: finiteNumber,
  key: z.string(),
  unit: GarminUnitSchema,
});

export const GarminActivityDetailMetricSchema = z.looseObject({
  metrics: z.array(finiteNumber.nullable()),
});

export const GarminApiDetailsResponseSchema = z.looseObject({
  activityId: finiteNumber,
  measurementCount: finiteNumber,
  metricsCount: finiteNumber,
  totalMetricsCount: finiteNumber,
  metricDescriptors: z.array(GarminMetricDescriptorSchema),
  activityDetailMetrics: z.array(GarminActivityDetailMetricSchema),
  detailsAvailable: z.boolean(),
});

export type GarminApiDetailsResponse = z.infer<
  typeof GarminApiDetailsResponseSchema
>;

export const GarminWorkoutSourceSchema = z
  .object({
    activity: GarminApiActivitySchema,
    details: GarminApiDetailsResponseSchema,
    exerciseSets: GarminExerciseSetsResponseSchema,
  })
  .strict();

export type GarminWorkoutSource = z.infer<typeof GarminWorkoutSourceSchema>;

export const GarminCursorSchema = z
  .object({
    version: z.literal(1),
    highestSyncedActivityId: finiteNumber,
  })
  .strict();

export type GarminCursor = z.infer<typeof GarminCursorSchema>;

export const initialGarminCursor: GarminCursor = {
  version: 1,
  highestSyncedActivityId: 0,
};
