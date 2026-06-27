import {
  getProviderState,
  upsertProviderState,
} from "../../db/provider-state.js";
import { getWorkoutsWithMetrics } from "../../db/workouts.js";
import { createTestDatabase } from "../../testing/test-database.js";
import { stringifyJson } from "../../utils/parse.js";
import { syncHevy } from "./sync.js";
import { initialHevyCursor } from "./types.js";

describe("syncHevy", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses workout events, upserts duplicate update events oldest-first, and advances the cursor", async () => {
    const testDb = createTestDatabase();
    const fetchCalls: Parameters<typeof fetch>[] = [];
    const fetchResponses = [
      jsonResponse({
        page: 1,
        page_count: 2,
        events: [
          {
            type: "updated",
            workout: hevyWorkout({
              id: "workout-1",
              updated_at: "2026-06-21T10:00:00Z",
              reps: 5,
            }),
          },
          {
            type: "deleted",
            id: "deleted-workout",
            deleted_at: "2026-06-22T10:00:00Z",
          },
        ],
      }),
      jsonResponse({
        page: 2,
        page_count: 2,
        events: [
          {
            type: "updated",
            workout: hevyWorkout({
              id: "workout-1",
              updated_at: "2026-06-20T10:00:00Z",
              reps: 1,
            }),
          },
        ],
      }),
    ];
    const fetchMock: typeof fetch = async (...args) => {
      fetchCalls.push(args);
      const response = fetchResponses.shift();
      if (!response) {
        throw new Error("Unexpected Hevy fetch call");
      }
      return response;
    };
    globalThis.fetch = fetchMock;

    try {
      upsertProviderState(
        testDb.db,
        "hevy",
        stringifyJson({ apiKey: "test-api-key" }),
        stringifyJson(initialHevyCursor),
        null,
      );
      const state = getProviderState(testDb.db, "hevy");
      if (!state) {
        throw new Error("Expected Hevy provider state");
      }

      const result = await syncHevy(testDb.db, state);
      const workouts = getWorkoutsWithMetrics(testDb.db, {
        startedAtFromMs: null,
        startedAtBeforeMs: null,
      });
      const nextState = getProviderState(testDb.db, "hevy");

      expect(result).toEqual({ newWorkoutCount: 1 });
      expect(fetchCalls).toHaveLength(2);
      expect(fetchCalls[0]?.[0].toString()).toContain(
        "/v1/workouts/events?since=1970-01-01T00%3A00%3A00Z&page=1&pageSize=10",
      );
      expect(workouts).toHaveLength(1);
      const workout = workouts[0];
      expect(workout?.type).toBe("strength");
      if (workout?.type !== "strength") {
        throw new Error("Expected strength workout");
      }
      expect(workout.strengthMetrics.exercisesJson).toBe(
        JSON.stringify([
          {
            title: "Bench Press",
            sets: [
              {
                weightKg: 100,
                reps: 5,
                durationSeconds: 0,
              },
            ],
          },
        ]),
      );
      expect(nextState?.cursorJson).toBe(
        stringifyJson({
          version: 1,
          since: "2026-06-22T10:00:00Z",
        }),
      );
    } finally {
      testDb.close();
    }
  });
});

function jsonResponse(value: object): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

function hevyWorkout(options: {
  id: string;
  updated_at: string;
  reps: number;
}) {
  return {
    id: options.id,
    title: "Upper",
    routine_id: null,
    description: null,
    start_time: "2026-06-21T08:00:00Z",
    end_time: "2026-06-21T09:00:00Z",
    updated_at: options.updated_at,
    created_at: "2026-06-21T09:00:00Z",
    exercises: [
      {
        index: 0,
        title: "Bench Press",
        notes: null,
        exercise_template_id: "bench",
        supersets_id: null,
        sets: [
          {
            index: 0,
            type: "normal",
            weight_kg: 100,
            reps: options.reps,
            duration_seconds: null,
            rpe: null,
            custom_metric: null,
          },
        ],
      },
    ],
  };
}
