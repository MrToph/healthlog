import { normalizeExerciseSetsResponse } from "./source.js";

describe("normalizeExerciseSetsResponse", () => {
  it("normalizes null Garmin arrays to empty arrays at the provider boundary", () => {
    expect(
      normalizeExerciseSetsResponse({
        activityId: 123,
        providerTopLevelField: "kept",
        exerciseSets: [
          {
            providerSetField: "kept",
            exercises: [
              {
                category: null,
                name: null,
                probability: null,
                providerExerciseField: "kept",
              },
            ],
            duration: 60,
            repetitionCount: 5,
            weight: 100,
            setType: "ACTIVE",
            startTime: "2026-01-02 09:01:00",
          },
        ],
      }),
    ).toEqual({
      activityId: 123,
      providerTopLevelField: "kept",
      exerciseSets: [
        {
          providerSetField: "kept",
          exercises: [
            {
              category: "Unknown",
              name: "Unknown",
              probability: 0,
              providerExerciseField: "kept",
            },
          ],
          duration: 60,
          repetitionCount: 5,
          weight: 100,
          setType: "ACTIVE",
          startTime: "2026-01-02 09:01:00",
          setIndex: 0,
        },
      ],
    });

    expect(
      normalizeExerciseSetsResponse({
        activityId: 123,
        exerciseSets: null,
      }),
    ).toEqual({
      activityId: 123,
      exerciseSets: [],
    });
  });
});
