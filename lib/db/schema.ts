import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const DATA_DIR = path.join(process.cwd(), ".data")
const DOCUMENTS_DIR = path.join(DATA_DIR, "documents")
const DB_PATH = path.join(DATA_DIR, "insurance.db")

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })

  _db = new Database(DB_PATH)
  _db.pragma("journal_mode = WAL")
  _db.pragma("foreign_keys = ON")

  _db.exec(`
    CREATE TABLE IF NOT EXISTS saved_policy (
      id          TEXT PRIMARY KEY,
      product     TEXT NOT NULL,
      name        TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_file (
      id          TEXT PRIMARY KEY,
      policy_id   TEXT NOT NULL REFERENCES saved_policy(id) ON DELETE CASCADE,
      filename    TEXT NOT NULL,
      media_type  TEXT NOT NULL,
      stored_path TEXT NOT NULL
    );
  `)

  return _db
}

export { DOCUMENTS_DIR }
