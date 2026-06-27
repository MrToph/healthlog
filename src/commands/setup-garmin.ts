import { input, password } from "@inquirer/prompts";
import { Command } from "commander";
import { openDatabase } from "../db/database.js";
import { GarminClient } from "../providers/garmin/client.js";
import { storeGarminCredentials } from "../services/setup-service.js";

export function createSetupGarminCommand(
  getDatabasePath: () => string,
): Command {
  return new Command("garmin")
    .description("Set up Garmin Connect credentials")
    .configureHelp({ showGlobalOptions: true })
    .action(async () => {
      const username = await input({
        message: "Garmin username:",
        validate: (value) =>
          value.trim() === "" ? "Garmin username is required" : true,
      });
      const garminPassword = await password({
        message: "Garmin password:",
        mask: "*",
        validate: (value) =>
          value.trim() === "" ? "Garmin password is required" : true,
      });

      const tokens = await GarminClient.login(username, garminPassword);
      const db = openDatabase(getDatabasePath());
      try {
        storeGarminCredentials(db, tokens);
      } finally {
        db.close();
      }
    });
}
