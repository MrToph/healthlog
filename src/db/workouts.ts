import type {
  EnduranceMetricsRow,
  StrengthMetricsRow,
  Workout,
  WorkoutWithMetrics,
} from "../domain/workout.js";
import { StartLocationSchema } from "../domain/workout.js";
import { parseJson, parseSchema } from "../utils/parse.js";
import type { HealthlogDatabase } from "./database.js";
import { insertEnduranceMetrics } from "./endurance-metrics.js";
import { insertStrengthMetrics } from "./strength-metrics.js";

type WorkoutWithMetricsDbRow = {
  id: string;
  provider: Workout["provider"];
  provider_id: string;
  type: Workout["type"];
  sport: string;
  title: string;
  started_at_ms: number;
  ended_at_ms: number | null;
  source_json: string;
  provider_extras_json: string | null;
  em_workout_id: string | null;
  em_duration_seconds: number | null;
  em_distance_meters: number | null;
  em_elevation_gain_meters: number | null;
  em_elevation_loss_meters: number | null;
  em_start_location_json: string | null;
  em_calories: number | null;
  em_avg_hr: number | null;
  em_max_hr: number | null;
  em_avg_running_cadence_spm: number | null;
  em_avg_stride_length_cm: number | null;
  em_avg_pace_min_per_km: string | null;
  em_fastest_pace_min_per_km: string | null;
  em_activity_metrics_json: string | null;
  sm_workout_id: string | null;
  sm_exercises_json: string | null;
};

export function workoutExists(db: HealthlogDatabase, id: string): boolean {
  const row = db.prepare("SELECT 1 FROM workouts WHERE id = ?").get(id) as
    | { "1": number }
    | undefined;
  return Boolean(row);
}

export function upsertNormalizedWorkout(
  db: HealthlogDatabase,
  workoutWithMetrics: WorkoutWithMetrics,
): boolean {
  const inserted = !workoutExists(db, workoutWithMetrics.workout.id);

  db.prepare(`
    INSERT INTO workouts (
      id,
      provider,
      provider_id,
      type,
      sport,
      title,
      started_at_ms,
      ended_at_ms,
      source_json,
      provider_extras_json
    )
    VALUES (
      @id,
      @provider,
      @providerId,
      @type,
      @sport,
      @title,
      @startedAtMs,
      @endedAtMs,
      @sourceJson,
      @providerExtrasJson
    )
    ON CONFLICT(id) DO UPDATE SET
      provider = excluded.provider,
      provider_id = excluded.provider_id,
      type = excluded.type,
      sport = excluded.sport,
      title = excluded.title,
      started_at_ms = excluded.started_at_ms,
      ended_at_ms = excluded.ended_at_ms,
      source_json = excluded.source_json,
      provider_extras_json = excluded.provider_extras_json
  `).run(workoutWithMetrics.workout);

  db.prepare("DELETE FROM endurance_metrics WHERE workout_id = ?").run(
    workoutWithMetrics.workout.id,
  );
  db.prepare("DELETE FROM strength_metrics WHERE workout_id = ?").run(
    workoutWithMetrics.workout.id,
  );

  if (workoutWithMetrics.type === "endurance") {
    insertEnduranceMetrics(db, workoutWithMetrics.enduranceMetrics);
  } else {
    insertStrengthMetrics(db, workoutWithMetrics.strengthMetrics);
  }

  return inserted;
}

export function getWorkoutsWithMetrics(
  db: HealthlogDatabase,
  range: { startedAtFromMs: number | null; startedAtBeforeMs: number | null },
): WorkoutWithMetrics[] {
  const conditions: string[] = [];
  const params: Record<string, number> = {};

  if (range.startedAtFromMs !== null) {
    conditions.push("w.started_at_ms >= @startedAtFromMs");
    params.startedAtFromMs = range.startedAtFromMs;
  }
  if (range.startedAtBeforeMs !== null) {
    conditions.push("w.started_at_ms < @startedAtBeforeMs");
    params.startedAtBeforeMs = range.startedAtBeforeMs;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`
      SELECT
        w.id,
        w.provider,
        w.provider_id,
        w.type,
        w.sport,
        w.title,
        w.started_at_ms,
        w.ended_at_ms,
        w.source_json,
        w.provider_extras_json,
        em.workout_id AS em_workout_id,
        em.duration_seconds AS em_duration_seconds,
        em.distance_meters AS em_distance_meters,
        em.elevation_gain_meters AS em_elevation_gain_meters,
        em.elevation_loss_meters AS em_elevation_loss_meters,
        em.start_location_json AS em_start_location_json,
        em.calories AS em_calories,
        em.avg_hr AS em_avg_hr,
        em.max_hr AS em_max_hr,
        em.avg_running_cadence_spm AS em_avg_running_cadence_spm,
        em.avg_stride_length_cm AS em_avg_stride_length_cm,
        em.avg_pace_min_per_km AS em_avg_pace_min_per_km,
        em.fastest_pace_min_per_km AS em_fastest_pace_min_per_km,
        em.activity_metrics_json AS em_activity_metrics_json,
        sm.workout_id AS sm_workout_id,
        sm.exercises_json AS sm_exercises_json
      FROM workouts w
      LEFT JOIN endurance_metrics em ON em.workout_id = w.id
      LEFT JOIN strength_metrics sm ON sm.workout_id = w.id
      ${whereClause}
      ORDER BY w.started_at_ms ASC, w.id ASC
    `)
    .all(params) as WorkoutWithMetricsDbRow[];

  return rows.map(mapWorkoutWithMetrics);
}

function mapWorkoutWithMetrics(
  row: WorkoutWithMetricsDbRow,
): WorkoutWithMetrics {
  if (row.type === "endurance") {
    return {
      type: "endurance",
      workout: { ...mapWorkout(row), type: "endurance" },
      enduranceMetrics: mapEnduranceMetrics(row),
    };
  }

  return {
    type: "strength",
    workout: { ...mapWorkout(row), type: "strength" },
    strengthMetrics: mapStrengthMetrics(row),
  };
}

function mapWorkout(row: WorkoutWithMetricsDbRow): Workout {
  return {
    id: row.id,
    provider: row.provider,
    providerId: row.provider_id,
    type: row.type,
    sport: row.sport,
    title: row.title,
    startedAtMs: row.started_at_ms,
    endedAtMs: row.ended_at_ms,
    sourceJson: row.source_json,
    providerExtrasJson: row.provider_extras_json,
  };
}

function mapEnduranceMetrics(
  row: WorkoutWithMetricsDbRow,
): EnduranceMetricsRow {
  const workoutId = requireJoinedValue(row.em_workout_id, "em.workout_id");

  return {
    workoutId,
    durationSeconds: requireJoinedValue(
      row.em_duration_seconds,
      "em.duration_seconds",
    ),
    distanceMeters: requireJoinedValue(
      row.em_distance_meters,
      "em.distance_meters",
    ),
    elevationGainMeters: requireJoinedValue(
      row.em_elevation_gain_meters,
      "em.elevation_gain_meters",
    ),
    elevationLossMeters: requireJoinedValue(
      row.em_elevation_loss_meters,
      "em.elevation_loss_meters",
    ),
    startLocation: parseStartLocation(row.em_start_location_json, workoutId),
    calories: requireJoinedValue(row.em_calories, "em.calories"),
    averageHeartRate: requireJoinedValue(row.em_avg_hr, "em.avg_hr"),
    maxHeartRate: requireJoinedValue(row.em_max_hr, "em.max_hr"),
    averageRunningCadenceStepsPerMinute: requireJoinedValue(
      row.em_avg_running_cadence_spm,
      "em.avg_running_cadence_spm",
    ),
    averageStrideLengthCentimeters: requireJoinedValue(
      row.em_avg_stride_length_cm,
      "em.avg_stride_length_cm",
    ),
    averagePaceMinutesPerKilometer: requireJoinedValue(
      row.em_avg_pace_min_per_km,
      "em.avg_pace_min_per_km",
    ),
    fastestPaceMinutesPerKilometer: requireJoinedValue(
      row.em_fastest_pace_min_per_km,
      "em.fastest_pace_min_per_km",
    ),
    activityMetricsJson: requireJoinedValue(
      row.em_activity_metrics_json,
      "em.activity_metrics_json",
    ),
  };
}

function parseStartLocation(
  startLocationJson: string | null,
  workoutId: string,
): EnduranceMetricsRow["startLocation"] {
  if (startLocationJson === null) {
    return null;
  }

  return parseSchema(
    StartLocationSchema,
    parseJson(startLocationJson, `start_location_json for ${workoutId}`),
    `start location for workout ${workoutId}`,
  );
}

function mapStrengthMetrics(row: WorkoutWithMetricsDbRow): StrengthMetricsRow {
  return {
    workoutId: requireJoinedValue(row.sm_workout_id, "sm.workout_id"),
    exercisesJson: requireJoinedValue(
      row.sm_exercises_json,
      "sm.exercises_json",
    ),
  };
}

function requireJoinedValue<T>(value: T | null, column: string): T {
  if (value === null) {
    throw new Error(`Missing joined column ${column}`);
  }
  return value;
}
