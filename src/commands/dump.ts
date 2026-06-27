import { Command } from "commander";
import { openDatabase } from "../db/database.js";
import { buildDumpDocument } from "../services/dump-service.js";
import { syncConfiguredProviders } from "../services/sync-service.js";
import { parseDateRange } from "../utils/dates.js";

type DumpOptions = {
  from?: string;
  to?: string;
  pretty?: boolean;
};

export function createDumpCommand(getDatabasePath: () => string): Command {
  return new Command("dump")
    .description("Sync configured providers and dump normalized workout JSON")
    .configureHelp({ showGlobalOptions: true })
    .option("--from <date>", "Start date, YYYY-MM-DD")
    .option("--to <date>", "End date, YYYY-MM-DD")
    .option("--pretty", "Pretty-print JSON output")
    .action(async (options: DumpOptions) => {
      const range = parseDateRange(options);
      const db = openDatabase(getDatabasePath());
      try {
        await syncConfiguredProviders(db);
        const dump = buildDumpDocument(db, range);
        console.log(
          options.pretty ? JSON.stringify(dump, null, 2) : JSON.stringify(dump),
        );
      } finally {
        db.close();
      }
    });
}
