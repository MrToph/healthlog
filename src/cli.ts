#!/usr/bin/env node
import { Command } from "commander";
import { createDumpCommand } from "./commands/dump.js";
import { createSetupGarminCommand } from "./commands/setup-garmin.js";
import { createSetupHevyCommand } from "./commands/setup-hevy.js";
import { resolveDatabasePath } from "./config/database-path.js";
import {
  isVerbose,
  isVerboseArgv,
  logger,
  setLoggerVerbose,
} from "./utils/logger.js";

process.setSourceMapsEnabled(true);

type GlobalOptions = {
  db?: string;
  verbose?: boolean;
};

export function createProgram(): Command {
  const program = new Command();

  program
    .name("healthlog")
    .description(
      "Sync Garmin and Hevy workout data into SQLite and dump normalized JSON",
    )
    .configureHelp({ showGlobalOptions: true })
    .option("--db <path>", "Override SQLite database path")
    .option("--verbose", "Enable verbose debug logging")
    .hook("preAction", () => {
      setLoggerVerbose(isVerbose(program.opts<GlobalOptions>()));
    });

  const getDatabasePath = () => {
    const options = program.opts<GlobalOptions>();
    return resolveDatabasePath({ cliPath: options.db });
  };

  const setup = new Command("setup")
    .description("Set up provider credentials")
    .configureHelp({ showGlobalOptions: true })
    .addCommand(createSetupGarminCommand(getDatabasePath))
    .addCommand(createSetupHevyCommand(getDatabasePath));

  program.addCommand(setup);
  program.addCommand(createDumpCommand(getDatabasePath));

  return program;
}

async function main(): Promise<void> {
  try {
    await createProgram().parseAsync(process.argv);
  } catch (error) {
    const verbose = isVerboseArgv(process.argv);
    setLoggerVerbose(verbose);
    logger.error(
      error instanceof Error && verbose
        ? (error.stack ?? error.message)
        : error instanceof Error
          ? error.message
          : String(error),
    );
    process.exitCode = 1;
  }
}

await main();
