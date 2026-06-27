import type { StrengthMetricsRow } from "../domain/workout.js";
import type { HealthlogDatabase } from "./database.js";

export function insertStrengthMetrics(
  db: HealthlogDatabase,
  metrics: StrengthMetricsRow,
): void {
  const statement = db.prepare(`
    INSERT INTO strength_metrics (
      workout_id,
      exercises_json
    )
    VALUES (
      @workoutId,
      @exercisesJson
    )
  `);

  statement.run(metrics);
}
