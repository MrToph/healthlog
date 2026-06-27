export const providers = ["garmin", "hevy"] as const;

export type Provider = (typeof providers)[number];

export type ProviderSyncResult = {
  newWorkoutCount: number;
};
