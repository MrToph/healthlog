# healthlog

`healthlog` is a TypeScript CLI that syncs Garmin and Hevy workout data into a local SQLite database and dumps a normalized JSON view for analysis.

## Setup

Install dependencies:

```sh
pnpm install
```

Configure Garmin:

```sh
healthlog setup garmin
```

Configure Hevy:

```sh
healthlog setup hevy
```

Get the Hevy API key from [Hevy developer settings](https://hevy.com/settings?developer). This requires Hevy Pro.

Dump workouts:

```sh
# First sync may take a while as it syncs all activities.
healthlog dump --verbose --pretty
healthlog dump --from 2026-01-01 --to 2026-06-27
```
