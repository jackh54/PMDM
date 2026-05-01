import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";

const migrationsDir = path.resolve("src/db/migrations");
const dbPath = config.DATABASE_URL.startsWith("./")
  ? path.resolve(config.DATABASE_URL)
  : config.DATABASE_URL;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export function runMigrations() {
  const appliedRows = db.prepare("SELECT filename FROM schema_migrations").all();
  const applied = new Set(appliedRows.map((row) => row.filename));
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  const insertMigration = db.prepare("INSERT INTO schema_migrations (filename) VALUES (?)");
  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    insertMigration.run(file);
  }
}

export { db };
