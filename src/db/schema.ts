import type { HealthlogDatabase } from "./database.js";

export function initializeSchema(db: HealthlogDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provider_state (
      provider TEXT PRIMARY KEY CHECK (provider IN ('garmin', 'hevy')),
      credentials_json TEXT NOT NULL,
      cursor_json TEXT NOT NULL,
      last_synced_at_ms INTEGER,
      updated_at_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL CHECK (provider IN ('garmin', 'hevy')),
      provider_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('endurance', 'strength')),
      sport TEXT NOT NULL,
      title TEXT NOT NULL,
      started_at_ms INTEGER NOT NULL,
      ended_at_ms INTEGER,
      source_json TEXT NOT NULL,
      provider_extras_json TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS workouts_provider_provider_id_idx
    ON workouts (provider, provider_id);

    CREATE INDEX IF NOT EXISTS workouts_started_at_id_idx
    ON workouts (started_at_ms, id);

    CREATE TABLE IF NOT EXISTS endurance_metrics (
      workout_id TEXT PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
      duration_seconds REAL NOT NULL,
      distance_meters REAL NOT NULL,
      elevation_gain_meters REAL NOT NULL,
      elevation_loss_meters REAL NOT NULL,
      start_location_json TEXT,
      calories REAL NOT NULL,
      avg_hr REAL NOT NULL,
      max_hr REAL NOT NULL,
      avg_running_cadence_spm REAL NOT NULL,
      avg_stride_length_cm REAL NOT NULL,
      avg_pace_min_per_km TEXT NOT NULL,
      fastest_pace_min_per_km TEXT NOT NULL,
      activity_metrics_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strength_metrics (
      workout_id TEXT PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
      exercises_json TEXT NOT NULL
    );
  `);
}
