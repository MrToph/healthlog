import { parseSchema } from "../../utils/parse.js";
import type { HevyApiWorkout, HevyWorkoutSource } from "./types.js";
import { HevyApiWorkoutSourceSchema } from "./types.js";

export function buildHevyWorkoutSource(
  workout: HevyApiWorkout,
): HevyWorkoutSource {
  return parseSchema(
    HevyApiWorkoutSourceSchema,
    { workout },
    "Hevy workout source",
  );
}
