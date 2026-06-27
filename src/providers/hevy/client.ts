import { parseSchema } from "../../utils/parse.js";
import type {
  HevyApiPaginatedWorkoutEvents,
  HevyCredentials,
} from "./types.js";
import {
  HevyApiPaginatedWorkoutEventsSchema,
  HevyApiUserInfoResponseSchema,
} from "./types.js";

const hevyApiBaseUrl = "https://api.hevyapp.com";
// Hevy caps workout event pages at 10 items.
const hevyPageSize = 10;

export class HevyClient {
  readonly #apiKey: string;

  private constructor(credentials: HevyCredentials) {
    this.#apiKey = credentials.apiKey;
  }

  static fromCredentials(credentials: HevyCredentials): HevyClient {
    return new HevyClient(credentials);
  }

  static async verifyApiKey(apiKey: string): Promise<void> {
    const client = new HevyClient({ apiKey });
    await client.getUserInfo();
  }

  async getWorkoutEvents(
    since: string,
    page: number,
  ): Promise<HevyApiPaginatedWorkoutEvents> {
    const url = new URL("/v1/workouts/events", hevyApiBaseUrl);
    url.searchParams.set("since", since);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(hevyPageSize));

    return parseSchema(
      HevyApiPaginatedWorkoutEventsSchema,
      await this.getJson(url),
      `Hevy workout events page ${page} response`,
    );
  }

  private async getUserInfo(): Promise<void> {
    const url = new URL("/v1/user/info", hevyApiBaseUrl);
    parseSchema(
      HevyApiUserInfoResponseSchema,
      await this.getJson(url),
      "Hevy user info response",
    );
  }

  private async getJson(url: URL): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        "api-key": this.#apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Hevy API request failed: ${response.status} ${response.statusText}${body.length > 0 ? `: ${body}` : ""}`,
      );
    }

    return (await response.json()) as unknown;
  }
}
