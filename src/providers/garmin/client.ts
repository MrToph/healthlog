import garminConnectPackage from "garmin-connect";
import { parseSchema } from "../../utils/parse.js";
import type {
  GarminApiActivity,
  GarminApiDetailsResponse,
  GarminApiExerciseSetsResponse,
  GarminTokens,
} from "./types.js";
import {
  GarminApiActivitiesSchema,
  GarminApiDetailsResponseSchema,
  GarminApiExerciseSetsResponseSchema,
} from "./types.js";

type GarminConnectConstructor =
  typeof import("garmin-connect/dist/garmin/GarminConnect.js")["default"];
type GarminConnectInstance = InstanceType<GarminConnectConstructor>;

const { GarminConnect } = garminConnectPackage as unknown as {
  GarminConnect: GarminConnectConstructor;
};

const garminActivityDetailsUrl = (activityId: number) =>
  `https://connectapi.garmin.com/activity-service/activity/${activityId}/details`;

const garminExerciseSetsUrl = (activityId: number) =>
  `https://connectapi.garmin.com/activity-service/activity/${activityId}/exerciseSets`;

export class GarminClient {
  readonly #client: GarminConnectInstance;

  private constructor(client: GarminConnectInstance) {
    this.#client = client;
  }

  static async login(
    username: string,
    password: string,
  ): Promise<GarminTokens> {
    const client = new GarminConnect({ username, password });
    await client.login();
    return client.exportToken();
  }

  static fromTokens(tokens: GarminTokens): GarminClient {
    const client = new GarminConnect({ username: "", password: "" });
    client.loadToken(tokens.oauth1, tokens.oauth2);
    return new GarminClient(client);
  }

  async getActivities(
    start: number,
    limit: number,
  ): Promise<GarminApiActivity[]> {
    return parseSchema(
      GarminApiActivitiesSchema,
      await this.#client.getActivities(start, limit),
      "Garmin activities response",
    );
  }

  async getActivityDetails(
    activityId: number,
  ): Promise<GarminApiDetailsResponse> {
    return parseSchema(
      GarminApiDetailsResponseSchema,
      // garmin-connect does not expose useful types for these raw endpoint responses.
      // Treat them as boundary values and parse with zod before using them.
      await this.#client.get<unknown>(garminActivityDetailsUrl(activityId)),
      `Garmin activity ${activityId} details response`,
    );
  }

  async getExerciseSets(
    activityId: number,
  ): Promise<GarminApiExerciseSetsResponse> {
    return parseSchema(
      GarminApiExerciseSetsResponseSchema,
      // garmin-connect does not expose useful types for these raw endpoint responses.
      // Treat them as boundary values and parse with zod before using them.
      await this.#client.get<unknown>(garminExerciseSetsUrl(activityId)),
      `Garmin activity ${activityId} exercise sets response`,
    );
  }
}
