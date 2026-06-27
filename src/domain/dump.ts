import type { Provider } from "./provider.js";
import type {
  ActivityMetric,
  StartLocation,
  StrengthExercise,
} from "./workout.js";

export type DumpRange = {
  from: string | null;
  to: string | null;
};

export type DumpDocument = {
  generatedAt: string;
  range: DumpRange;
  workouts: DumpWorkout[];
};

export type DumpWorkout = DumpEnduranceWorkout | DumpStrengthWorkout;

type DumpWorkoutBase = {
  id: string;
  provider: Provider;
  providerId: string;
  type: "endurance" | "strength";
  sport: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  providerExtras: unknown | null;
};

export type DumpEnduranceWorkout = DumpWorkoutBase & {
  type: "endurance";
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
  activityMetrics: ActivityMetric[];
};

export type DumpStrengthWorkout = DumpWorkoutBase & {
  type: "strength";
  exercises: DumpStrengthExercise[];
};

export type DumpStrengthExercise = StrengthExercise;
