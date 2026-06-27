import { password } from "@inquirer/prompts";
import { Command } from "commander";
import { openDatabase } from "../db/database.js";
import { HevyClient } from "../providers/hevy/client.js";
import { storeHevyCredentials } from "../services/setup-service.js";

export function createSetupHevyCommand(getDatabasePath: () => string): Command {
  return new Command("hevy")
    .description("Set up Hevy API credentials")
    .configureHelp({ showGlobalOptions: true })
    .action(async () => {
      const apiKey = await password({
        message: "Hevy API key:",
        mask: "*",
        validate: (value) =>
          value.trim() === "" ? "Hevy API key is required" : true,
      });
      const trimmedApiKey = apiKey.trim();

      await HevyClient.verifyApiKey(trimmedApiKey);

      const db = openDatabase(getDatabasePath());
      try {
        storeHevyCredentials(db, trimmedApiKey);
      } finally {
        db.close();
      }
    });
}
