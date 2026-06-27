---
name: healthlog-analysis
description: Use the healthlog CLI to sync Garmin and Hevy health data, dump normalized JSON to a temporary file, and analyze progress without loading the full raw dump into context.
---

# Healthlog Analysis

Use this skill when analyzing the user's healthlog data with the `healthlog` CLI. The user configures providers separately; do not run setup commands.

## Dump Data

Always dump to a temporary file first. `healthlog dump` writes JSON to stdout and sync/progress logs to stderr, so redirecting stdout is safe. Replace `<dump-file.json>` with an OS-appropriate temporary file path.

```sh
healthlog dump --from 2026-01-01 --to 2026-06-27 > <dump-file.json>
```

For broad analysis, ask for a date range or choose a recent focused range. First sync may take a while because it syncs all configured provider data. If the command fails, stop and report the error instead of using stale data.

Use `--pretty` only for human inspection, not for machine processing:

```sh
healthlog dump --from 2026-01-01 --to 2026-06-27 --pretty > <dump-file.json>
```

## Avoid Context Pollution

Do not read the full JSON dump into model context. The dump can contain dense time-series arrays (`activityMetrics`) and many workouts. Use `jq`, small Node scripts, or other local processing to aggregate first, then inspect only compact results.

Good first checks:

```sh
jq '.workouts | length' <dump-file.json>
jq -r '.workouts[] | [.startedAt, .type, .sport, .title] | @tsv' <dump-file.json> | tail -40
jq '.workouts | group_by(.type) | map({type: .[0].type, count: length})' <dump-file.json>
```

For quick schema inspection, remove heavy arrays:

```sh
jq '.workouts[0] | del(.activityMetrics)' <dump-file.json>
```

For endurance summaries, aggregate `activityMetrics` instead of printing them:

```sh
jq '
  .workouts[]
  | select(.type == "endurance")
  | {
      startedAt,
      sport,
      title,
      durationSeconds,
      distanceMeters,
      elevationGainMeters,
      elevationLossMeters,
      averageHeartRate,
      averagePaceMinutesPerKilometer,
      fastestPaceMinutesPerKilometer,
      samples: (.activityMetrics | length)
    }
' <dump-file.json>
```

For strength summaries:

```sh
jq '
  .workouts[]
  | select(.type == "strength")
  | {
      startedAt,
      title,
      exercises: [
        .exercises[]
        | {
            title,
            sets: (.sets | length),
            volumeKg: ([.sets[] | .weightKg * .reps] | add // 0),
            maxWeightKg: ([.sets[].weightKg] | max // 0),
            totalReps: ([.sets[].reps] | add // 0)
          }
      ]
    }
' <dump-file.json>
```

## Dump Schema

The dump JSON has this shape:

```ts
type DumpDocument = {
  generatedAt: string;
  range: {
    from: string | null;
    to: string | null;
  };
  workouts: DumpWorkout[];
};

type DumpWorkout = DumpEnduranceWorkout | DumpStrengthWorkout;

type DumpWorkoutBase = {
  id: string;
  provider: "garmin" | "hevy";
  providerId: string;
  type: "endurance" | "strength";
  sport: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  providerExtras: unknown | null;
};

type DumpEnduranceWorkout = DumpWorkoutBase & {
  type: "endurance";
  durationSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  startLocation: [latitude: number, longitude: number] | null;
  calories: number;
  averageHeartRate: number;
  maxHeartRate: number;
  averageRunningCadenceStepsPerMinute: number;
  averageStrideLengthCentimeters: number;
  averagePaceMinutesPerKilometer: string;
  fastestPaceMinutesPerKilometer: string;
  activityMetrics: [
    secondsElapsed: number,
    heartRate: number,
    paceMinutesPerKilometer: string,
  ][];
};

type DumpStrengthWorkout = DumpWorkoutBase & {
  type: "strength";
  exercises: {
    title: string;
    sets: {
      weightKg: number;
      reps: number;
      durationSeconds: number;
    }[];
  }[];
};
```

Missing provider metric values are normalized to `0`. Arrays are empty arrays, not `null`.

## Analysis Hygiene

Choose the analysis method based on the user's question. Before drawing conclusions, reduce the dump into compact intermediate tables or aggregates that preserve the relevant fields.

Useful data-handling notes:

- Filter by `type`, `sport`, and date before aggregating when those dimensions matter.
- Treat `"0:00"` pace samples as missing/non-running pace values.
- For endurance workouts, keep duration, elevation gain/loss, and any known route or weather context available for analysis when relevant.
- For strength, exercise titles are provider-normalized labels; compare like-named exercises carefully.
