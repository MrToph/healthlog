import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { initializeSchema } from "./schema.js";

export type HealthlogDatabase = Database.Database;

export function openDatabase(databasePath: string): HealthlogDatabase {
  const directory = path.dirname(databasePath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });

  const db = new Database(databasePath);
  try {
    fs.chmodSync(directory, 0o700);
    fs.chmodSync(databasePath, 0o600);
  } catch {
    // Best effort only; not every filesystem honors POSIX permissions.
  }

  db.pragma("foreign_keys = ON");
  initializeSchema(db);
  return db;
}
