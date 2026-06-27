import { normalizeGarminWorkoutSource } from "./normalize.js";
import type { GarminWorkoutSource } from "./types.js";

describe("normalizeGarminWorkoutSource", () => {
  it("normalizes an endurance activity", () => {
    const source: GarminWorkoutSource = {
      activity: {
        activityId: 123,
        activityName: "Morning Run",
        startTimeGMT: "2026-01-02 08:00:00",
        activityType: {
          typeId: 1,
          typeKey: "street_running",
          parentTypeId: 1,
          isHidden: false,
          sortOrder: null,
          trimmable: true,
          restricted: false,
        },
        duration: 1800,
        distance: 5000,
        elevationGain: 120,
        elevationLoss: 90,
        startLatitude: 47.364,
        startLongitude: 8.552,
        calories: 400,
        averageHR: 145,
        maxHR: 180,
        averageRunningCadenceInStepsPerMinute: 153.5,
        avgStrideLength: 85.6,
        averageSpeed: 2.77,
        maxSpeed: 4.1,
      },
      details: {
        activityId: 123,
        measurementCount: 0,
        metricsCount: 0,
        totalMetricsCount: 0,
        metricDescriptors: [
          {
            metricsIndex: 0,
            key: "sumElapsedDuration",
            unit: {
              id: 1,
              key: "second",
              factor: 1,
            },
          },
          {
            metricsIndex: 1,
            key: "directHeartRate",
            unit: {
              id: 2,
              key: "bpm",
              factor: 1,
            },
          },
          {
            metricsIndex: 2,
            key: "directSpeed",
            unit: {
              id: 3,
              key: "mps",
              factor: 1,
            },
          },
        ],
        activityDetailMetrics: [
          {
            metrics: [0, 140, 2.5],
          },
          {
            metrics: [60, 145, null],
          },
        ],
        detailsAvailable: true,
      },
      exerciseSets: {
        activityId: 123,
        exerciseSets: [],
      },
    };

    const rows = normalizeGarminWorkoutSource(source);

    expect(rows.type).toBe("endurance");
    if (rows.type !== "endurance") {
      throw new Error("Expected endurance workout");
    }
    expect(rows.workout).toMatchObject({
      id: "garmin:123",
      provider: "garmin",
      providerId: "123",
      type: "endurance",
      sport: "street_running",
      title: "Morning Run",
      startedAtMs: Date.UTC(2026, 0, 2, 8, 0, 0),
      endedAtMs: Date.UTC(2026, 0, 2, 8, 30, 0),
      providerExtrasJson: null,
    });
    expect(rows.enduranceMetrics).toMatchObject({
      workoutId: "garmin:123",
      durationSeconds: 1800,
      distanceMeters: 5000,
      elevationGainMeters: 120,
      elevationLossMeters: 90,
      startLocation: [47.364, 8.552],
      calories: 400,
      averageHeartRate: 145,
      maxHeartRate: 180,
      averageRunningCadenceStepsPerMinute: 153.5,
      averageStrideLengthCentimeters: 85.6,
      averagePaceMinutesPerKilometer: "6:01",
      fastestPaceMinutesPerKilometer: "4:04",
      activityMetricsJson: JSON.stringify([
        [0, 140, "6:40"],
        [60, 145, "0:00"],
      ]),
    });
  });

  it("normalizes missing Garmin endurance metrics to zero", () => {
    const source: GarminWorkoutSource = {
      activity: {
        activityId: 124,
        activityName: "Walk",
        startTimeGMT: "2026-01-02 08:00:00",
        activityType: {
          typeKey: "walking",
        },
        duration: null,
        distance: null,
        calories: null,
        averageHR: null,
        maxHR: null,
        averageSpeed: null,
        maxSpeed: null,
      },
      details: {
        activityId: 124,
        measurementCount: 0,
        metricsCount: 0,
        totalMetricsCount: 0,
        metricDescriptors: [],
        activityDetailMetrics: [],
        detailsAvailable: true,
      },
      exerciseSets: {
        activityId: 124,
        exerciseSets: [],
      },
    };

    const rows = normalizeGarminWorkoutSource(source);

    expect(rows.type).toBe("endurance");
    if (rows.type !== "endurance") {
      throw new Error("Expected endurance workout");
    }
    expect(rows.workout.endedAtMs).toBe(Date.UTC(2026, 0, 2, 8, 0, 0));
    expect(rows.enduranceMetrics).toEqual({
      workoutId: "garmin:124",
      durationSeconds: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      startLocation: null,
      calories: 0,
      averageHeartRate: 0,
      maxHeartRate: 0,
      averageRunningCadenceStepsPerMinute: 0,
      averageStrideLengthCentimeters: 0,
      averagePaceMinutesPerKilometer: "0:00",
      fastestPaceMinutesPerKilometer: "0:00",
      activityMetricsJson: JSON.stringify([]),
    });
  });

  it("normalizes Garmin strength sets when Garmin reports strength", () => {
    const source: GarminWorkoutSource = {
      activity: {
        activityId: 456,
        activityName: "Strength",
        startTimeGMT: "2026-01-02 09:00:00",
        activityType: {
          typeId: 13,
          typeKey: "strength_training",
          parentTypeId: 1,
          isHidden: false,
          sortOrder: null,
          trimmable: true,
          restricted: false,
        },
        duration: 1200,
        distance: 0,
        calories: 200,
        averageHR: 110,
        maxHR: 140,
        averageSpeed: 0,
        maxSpeed: 0,
      },
      details: {
        activityId: 456,
        measurementCount: 0,
        metricsCount: 0,
        totalMetricsCount: 0,
        metricDescriptors: [],
        activityDetailMetrics: [],
        detailsAvailable: true,
      },
      exerciseSets: {
        activityId: 456,
        exerciseSets: [
          {
            exercises: [
              {
                category: "BENCH_PRESS",
                name: "Bench Press",
                probability: 0.9,
              },
            ],
            duration: 60,
            repetitionCount: 5,
            weight: 100000,
            setType: "ACTIVE",
            startTime: "2026-01-02 09:01:00",
            setIndex: 1,
          },
          {
            exercises: [],
            duration: 120,
            repetitionCount: null,
            weight: null,
            setType: "REST",
            startTime: "2026-01-02 09:02:00",
            setIndex: 2,
          },
        ],
      },
    };

    const rows = normalizeGarminWorkoutSource(source);

    expect(rows.type).toBe("strength");
    if (rows.type !== "strength") {
      throw new Error("Expected strength workout");
    }
    expect(rows.workout.type).toBe("strength");
    expect(rows.workout.providerExtrasJson).toBe(
      JSON.stringify({
        calories: 200,
        averageHeartRate: 110,
        maxHeartRate: 140,
      }),
    );
    expect(rows.strengthMetrics).toEqual({
      workoutId: "garmin:456",
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
    });
  });

  it("uses Unknown when Garmin strength sets have no exercise guesses", () => {
    const source: GarminWorkoutSource = {
      activity: {
        activityId: 789,
        activityName: "Strength",
        startTimeGMT: "2026-01-02 09:00:00",
        activityType: {
          typeId: 13,
          typeKey: "strength_training",
          parentTypeId: 1,
          isHidden: false,
          sortOrder: null,
          trimmable: true,
          restricted: false,
        },
        duration: 1200,
        distance: 0,
        calories: 200,
        averageHR: 110,
        maxHR: 140,
        averageSpeed: 0,
        maxSpeed: 0,
      },
      details: {
        activityId: 789,
        measurementCount: 0,
        metricsCount: 0,
        totalMetricsCount: 0,
        metricDescriptors: [],
        activityDetailMetrics: [],
        detailsAvailable: true,
      },
      exerciseSets: {
        activityId: 789,
        exerciseSets: [
          {
            exercises: [],
            duration: 60,
            repetitionCount: 5,
            weight: 100000,
            setType: "ACTIVE",
            startTime: "2026-01-02 09:01:00",
            setIndex: 1,
          },
        ],
      },
    };

    const rows = normalizeGarminWorkoutSource(source);

    expect(rows.type).toBe("strength");
    if (rows.type !== "strength") {
      throw new Error("Expected strength workout");
    }
    expect(rows.strengthMetrics.exercisesJson).toBe(
      JSON.stringify([
        {
          title: "Unknown",
          sets: [
            {
              weightKg: 100,
              reps: 5,
              durationSeconds: 60,
            },
          ],
        },
      ]),
    );
  });

  it("normalizes missing Garmin strength weight and reps to zero", () => {
    const source: GarminWorkoutSource = {
      activity: {
        activityId: 790,
        activityName: "Strength",
        startTimeGMT: "2026-01-02 09:00:00",
        activityType: {
          typeKey: "strength_training",
        },
        duration: 1200,
      },
      details: {
        activityId: 790,
        measurementCount: 0,
        metricsCount: 0,
        totalMetricsCount: 0,
        metricDescriptors: [],
        activityDetailMetrics: [],
        detailsAvailable: true,
      },
      exerciseSets: {
        activityId: 790,
        exerciseSets: [
          {
            exercises: [],
            duration: 60,
            repetitionCount: null,
            weight: null,
            setType: "ACTIVE",
            startTime: "2026-01-02 09:01:00",
            setIndex: 1,
          },
        ],
      },
    };

    const rows = normalizeGarminWorkoutSource(source);

    expect(rows.type).toBe("strength");
    if (rows.type !== "strength") {
      throw new Error("Expected strength workout");
    }
    expect(rows.strengthMetrics.exercisesJson).toBe(
      JSON.stringify([
        {
          title: "Unknown",
          sets: [
            {
              weightKg: 0,
              reps: 0,
              durationSeconds: 60,
            },
          ],
        },
      ]),
    );
  });
});
