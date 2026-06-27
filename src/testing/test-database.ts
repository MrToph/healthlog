import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type HealthlogDatabase, openDatabase } from "../db/database.js";

export type TestDatabase = {
  db: HealthlogDatabase;
  path: string;
  close(): void;
};

export function createTestDatabase(): TestDatabase {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "healthlog-test-"));
  const databasePath = path.join(directory, "db.sqlite3");
  const db = openDatabase(databasePath);

  return {
    db,
    path: databasePath,
    close() {
      db.close();
    },
  };
}
