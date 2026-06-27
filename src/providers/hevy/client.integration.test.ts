import {
  describeIntegration,
  readIntegrationCredentialsJson,
} from "../../testing/integration-credentials.js";
import { parseJson, parseSchema } from "../../utils/parse.js";
import { HevyClient } from "./client.js";
import { HevyCredentialsSchema, initialHevyCursor } from "./types.js";

describeIntegration("HevyClient integration", () => {
  it("fetches one page of workout events", async () => {
    const credentials = parseSchema(
      HevyCredentialsSchema,
      parseJson(readIntegrationCredentialsJson("hevy"), "hevy credentials"),
      "Hevy credentials",
    );
    const client = HevyClient.fromCredentials(credentials);

    const page = await client.getWorkoutEvents(initialHevyCursor.since, 1);

    expect(page.page).toBe(1);
    expect(page.events.length).toBeGreaterThan(0);
    expect(page.events.length).toBeLessThanOrEqual(10);
  });
});
