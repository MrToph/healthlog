import { z } from "zod";
import type { Provider } from "./provider.js";

export type WorkoutType = "endurance" | "strength";

export type Workout = {
  id: string;
  provider: Provider;
  providerId: string;
  type: WorkoutType;
  sport: string;
  title: string;
  startedAtMs: number;
  endedAtMs: number | null;
  sourceJson: string;
  providerExtrasJson: string | null;
};

export const ActivityMetricSchema = z.tuple([
  z.number(),
  z.number(),
  z.string().min(1),
]);

export const ActivityMetricsSchema = z.array(ActivityMetricSchema);

export type ActivityMetric = z.infer<typeof ActivityMetricSchema>;

export const StartLocationSchema = z.tuple([z.number(), z.number()]);

export type StartLocation = z.infer<typeof StartLocationSchema>;

export type EnduranceMetricsRow = {
  workoutId: string;
  durationSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  startLocation: StartLocation | null;
  calories: number;
  averageHeartRate: number;
  maxHeartRate: number;
  averageRunningCadenceStepsPerMinute: number;
  averageStrideLengthCentimeters: number;
  averagePaceMinutesPerKilometer: string;
  fastestPaceMinutesPerKilometer: string;
  activityMetricsJson: string;
};

export const StrengthSetSchema = z
  .object({
    weightKg: z.number(),
    reps: z.number(),
    durationSeconds: z.number(),
  })
  .strict();

export const StrengthExerciseSchema = z
  .object({
    title: z.string().min(1),
    sets: z.array(StrengthSetSchema),
  })
  .strict();

export const StrengthExercisesSchema = z.array(StrengthExerciseSchema);

export type StrengthSet = z.infer<typeof StrengthSetSchema>;

export type StrengthExercise = z.infer<typeof StrengthExerciseSchema>;

export type StrengthMetricsRow = {
  workoutId: string;
  exercisesJson: string;
};

export type WorkoutWithMetrics =
  | {
      type: "endurance";
      workout: Workout & { type: "endurance" };
      enduranceMetrics: EnduranceMetricsRow;
    }
  | {
      type: "strength";
      workout: Workout & { type: "strength" };
      strengthMetrics: StrengthMetricsRow;
    };
