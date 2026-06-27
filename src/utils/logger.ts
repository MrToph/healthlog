import pc from "picocolors";

export type Logger = {
  info(message: string): void;
  debug(message: string): void;
  success(message: string): void;
  error(message: string): void;
};

export type VerboseOptionSource = {
  verbose?: boolean | undefined;
};

let loggerVerbose = false;

export const logger: Logger = {
  info(message) {
    console.error(pc.cyan(message));
  },
  debug(message) {
    if (loggerVerbose) {
      console.error(pc.gray(message));
    }
  },
  success(message) {
    console.error(pc.green(message));
  },
  error(message) {
    console.error(pc.red(message));
  },
};

export function setLoggerVerbose(verbose: boolean): void {
  loggerVerbose = verbose;
}

export function isVerbose(options: VerboseOptionSource): boolean {
  return !!options.verbose;
}

export function isVerboseArgv(argv: string[]): boolean {
  return argv.includes("--verbose");
}
