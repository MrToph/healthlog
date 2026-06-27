import os from "node:os";
import path from "node:path";

export type DatabasePathOptions = {
  cliPath?: string | undefined;
};

export function resolveDatabasePath(options: DatabasePathOptions): string {
  if (options.cliPath && options.cliPath.trim() !== "") {
    return path.resolve(options.cliPath);
  }

  const envPath = process.env.HEALTHLOG_DB_PATH;
  if (envPath && envPath.trim() !== "") {
    return path.resolve(envPath);
  }

  return platformDefaultDatabasePath();
}

function platformDefaultDatabasePath(): string {
  const home = os.homedir();

  if (process.platform === "darwin") {
    return path.join(
      home,
      "Library",
      "Application Support",
      "healthlog",
      "db.sqlite3",
    );
  }

  if (process.platform === "linux") {
    const xdgDataHome = process.env.XDG_DATA_HOME;
    const dataHome =
      xdgDataHome && xdgDataHome.trim() !== ""
        ? xdgDataHome
        : path.join(home, ".local", "share");
    return path.join(dataHome, "healthlog", "db.sqlite3");
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    const dataHome =
      localAppData && localAppData.trim() !== ""
        ? localAppData
        : path.join(home, "AppData", "Local");
    return path.join(dataHome, "healthlog", "db.sqlite3");
  }

  return path.join(home, ".healthlog", "db.sqlite3");
}
