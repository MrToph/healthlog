import { normalizeHevyWorkoutSource } from "./normalize.js";
import type { HevyWorkoutSource } from "./types.js";

describe("normalizeHevyWorkoutSource", () => {
  it("normalizes a Hevy workout into generic strength metrics", () => {
    const source: HevyWorkoutSource = {
      workout: {
        id: "workout-1",
        title: "Upper Body",
        routine_id: "routine-1",
        description: null,
        start_time: "2026-06-21T18:00:00Z",
        end_time: "2026-06-21T19:05:00Z",
        updated_at: "2026-06-21T19:10:00Z",
        created_at: "2026-06-21T19:06:00Z",
        exercises: [
          {
            index: 1,
            title: "Bench Press (Barbell)",
            notes: null,
            exercise_template_id: "bench",
            supersets_id: null,
            sets: [
              {
                index: 1,
                type: "normal",
                weight_kg: 100,
                reps: 5,
                duration_seconds: 45,
                rpe: 8,
                custom_metric: null,
              },
              {
                index: 0,
                type: "warmup",
                weight_kg: null,
                reps: null,
                duration_seconds: null,
                rpe: null,
                custom_metric: null,
              },
            ],
          },
        ],
      },
    };

    const rows = normalizeHevyWorkoutSource(source);

    expect(rows.type).toBe("strength");
    if (rows.type !== "strength") {
      throw new Error("Expected strength workout");
    }
    expect(rows.workout).toMatchObject({
      id: "hevy:workout-1",
      provider: "hevy",
      providerId: "workout-1",
      type: "strength",
      sport: "strength_training",
      title: "Upper Body",
      startedAtMs: Date.UTC(2026, 5, 21, 18, 0, 0),
      endedAtMs: Date.UTC(2026, 5, 21, 19, 5, 0),
      providerExtrasJson: null,
    });
    expect(rows.strengthMetrics).toEqual({
      workoutId: "hevy:workout-1",
      exercisesJson: JSON.stringify([
        {
          title: "Bench Press (Barbell)",
          sets: [
            {
              weightKg: 0,
              reps: 0,
              durationSeconds: 0,
            },
            {
              weightKg: 100,
              reps: 5,
              durationSeconds: 45,
            },
          ],
        },
      ]),
    });
  });
});
