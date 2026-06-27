import {
  describeIntegration,
  readIntegrationCredentialsJson,
} from "../../testing/integration-credentials.js";
import { parseJson, parseSchema } from "../../utils/parse.js";
import { GarminClient } from "./client.js";
import { GarminTokensSchema } from "./types.js";

describeIntegration("GarminClient integration", () => {
  it("fetches one page of activities", async () => {
    const tokens = parseSchema(
      GarminTokensSchema,
      parseJson(readIntegrationCredentialsJson("garmin"), "garmin credentials"),
      "Garmin credentials",
    );
    const client = GarminClient.fromTokens(tokens);

    const activities = await client.getActivities(0, 1);

    expect(activities.length).toBe(1);
  });
});
