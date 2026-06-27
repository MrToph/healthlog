import { z } from "zod";

const finiteNumber = z.number();
const nullableFiniteNumber = finiteNumber.nullable();

export const HevyCredentialsSchema = z
  .object({
    apiKey: z.string().min(1),
  })
  .strict();

export type HevyCredentials = z.infer<typeof HevyCredentialsSchema>;

export const HevyCursorSchema = z
  .object({
    version: z.literal(1),
    since: z.string().min(1),
  })
  .strict();

export type HevyCursor = z.infer<typeof HevyCursorSchema>;

export const initialHevyCursor: HevyCursor = {
  version: 1,
  since: "1970-01-01T00:00:00Z",
};

export const HevyApiUserInfoResponseSchema = z.looseObject({
  data: z.looseObject({}),
});

export type HevyApiUserInfoResponse = z.infer<
  typeof HevyApiUserInfoResponseSchema
>;

export const HevyApiSetSchema = z.looseObject({
  index: finiteNumber,
  type: z.string().min(1),
  weight_kg: nullableFiniteNumber,
  reps: nullableFiniteNumber,
  duration_seconds: nullableFiniteNumber,
  rpe: nullableFiniteNumber,
  custom_metric: nullableFiniteNumber,
});

export type HevyApiSet = z.infer<typeof HevyApiSetSchema>;

export const HevyApiExerciseSchema = z.looseObject({
  index: finiteNumber,
  title: z.string().min(1),
  notes: z.string().nullable(),
  exercise_template_id: z.string().nullish(),
  supersets_id: nullableFiniteNumber.optional(),
  sets: z.array(HevyApiSetSchema),
});

export type HevyApiExercise = z.infer<typeof HevyApiExerciseSchema>;

export const HevyApiWorkoutSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  routine_id: z.string().nullish(),
  description: z.string().nullable(),
  start_time: z.string().min(1),
  end_time: z.string().nullable(),
  updated_at: z.string().min(1),
  created_at: z.string().min(1),
  exercises: z.array(HevyApiExerciseSchema),
});

export type HevyApiWorkout = z.infer<typeof HevyApiWorkoutSchema>;

export const HevyApiWorkoutSourceSchema = z
  .object({
    workout: HevyApiWorkoutSchema,
  })
  .strict();

export type HevyWorkoutSource = z.infer<typeof HevyApiWorkoutSourceSchema>;

export const HevyApiUpdatedWorkoutEventSchema = z.looseObject({
  type: z.literal("updated"),
  workout: HevyApiWorkoutSchema,
});

export const HevyApiDeletedWorkoutEventSchema = z.looseObject({
  type: z.literal("deleted"),
  id: z.string().min(1),
  deleted_at: z.string().nullish(),
});

export const HevyApiWorkoutEventSchema = z.discriminatedUnion("type", [
  HevyApiUpdatedWorkoutEventSchema,
  HevyApiDeletedWorkoutEventSchema,
]);

export type HevyApiWorkoutEvent = z.infer<typeof HevyApiWorkoutEventSchema>;

export const HevyApiPaginatedWorkoutEventsSchema = z.looseObject({
  page: finiteNumber,
  page_count: finiteNumber,
  events: z.array(HevyApiWorkoutEventSchema),
});

export type HevyApiPaginatedWorkoutEvents = z.infer<
  typeof HevyApiPaginatedWorkoutEventsSchema
>;
