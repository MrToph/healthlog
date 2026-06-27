import { upsertNormalizedWorkout } from "../db/workouts.js";
import { createTestDatabase } from "../testing/test-database.js";
import { buildDumpDocument } from "./dump-service.js";

describe("buildDumpDocument", () => {
  it("returns workouts sorted by startedAt and omits source_json", () => {
    const testDb = createTestDatabase();
    try {
      upsertNormalizedWorkout(testDb.db, {
        type: "endurance",
        workout: {
          id: "garmin:2",
          provider: "garmin",
          providerId: "2",
          type: "endurance",
          sport: "cycling",
          title: "Ride",
          startedAtMs: Date.UTC(2026, 0, 3),
          endedAtMs: null,
          sourceJson: JSON.stringify({ secret: true }),
          providerExtrasJson: null,
        },
        enduranceMetrics: {
          workoutId: "garmin:2",
          durationSeconds: 0,
          distanceMeters: 0,
          elevationGainMeters: 120,
          elevationLossMeters: 90,
          startLocation: [47.364, 8.552],
          calories: 0,
          averageHeartRate: 0,
          maxHeartRate: 0,
          averageRunningCadenceStepsPerMinute: 153.5,
          averageStrideLengthCentimeters: 85.6,
          averagePaceMinutesPerKilometer: "0:00",
          fastestPaceMinutesPerKilometer: "0:00",
          activityMetricsJson: JSON.stringify([[0, 140, "6:40"]]),
        },
      });
      upsertNormalizedWorkout(testDb.db, {
        type: "strength",
        workout: {
          id: "garmin:1",
          provider: "garmin",
          providerId: "1",
          type: "strength",
          sport: "strength_training",
          title: "Lift",
          startedAtMs: Date.UTC(2026, 0, 2),
          endedAtMs: null,
          sourceJson: JSON.stringify({ secret: true }),
          providerExtrasJson: JSON.stringify({
            calories: 220,
            averageHeartRate: 110,
            maxHeartRate: 140,
          }),
        },
        strengthMetrics: {
          workoutId: "garmin:1",
          exercisesJson: JSON.stringify([
            {
              title: "Bench Press",
              sets: [
                {
                  weightKg: 100,
                  reps: 5,
                  durationSeconds: 60,
                },
              ],
            },
          ]),
        },
      });

      const dump = buildDumpDocument(testDb.db, {
        from: null,
        to: null,
        startedAtFromMs: null,
        startedAtBeforeMs: null,
      });

      expect(dump.workouts.map((workout) => workout.id)).toEqual([
        "garmin:1",
        "garmin:2",
      ]);
      expect(dump.workouts[0]).toMatchObject({
        type: "strength",
        providerExtras: {
          calories: 220,
          averageHeartRate: 110,
          maxHeartRate: 140,
        },
        exercises: [
          {
            title: "Bench Press",
            sets: [
              {
                weightKg: 100,
                reps: 5,
                durationSeconds: 60,
              },
            ],
          },
        ],
      });
      expect(dump.workouts[1]).toMatchObject({
        type: "endurance",
        providerExtras: null,
        elevationGainMeters: 120,
        elevationLossMeters: 90,
        startLocation: [47.364, 8.552],
        averagePaceMinutesPerKilometer: "0:00",
        fastestPaceMinutesPerKilometer: "0:00",
        averageRunningCadenceStepsPerMinute: 153.5,
        averageStrideLengthCentimeters: 85.6,
        activityMetrics: [[0, 140, "6:40"]],
      });
      expect(JSON.stringify(dump)).not.toContain("sourceJson");
      expect(JSON.stringify(dump)).not.toContain("source_json");
      expect(JSON.stringify(dump)).not.toContain("secret");
    } finally {
      testDb.close();
    }
  });
});
