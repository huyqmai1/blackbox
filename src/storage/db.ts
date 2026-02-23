import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const BLACKBOX_DIR = join(homedir(), '.blackbox');
const DB_PATH = join(BLACKBOX_DIR, 'blackbox.db');

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  mkdirSync(BLACKBOX_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  runMigrations(_db);

  return _db;
}

function runMigrations(db: Database.Database): void {
  const schemaPath = join(__dirname, 'schema.sql');
  let schemaSql: string;

  try {
    schemaSql = readFileSync(schemaPath, 'utf-8');
  } catch {
    // When bundled, schema.sql won't be a separate file — use inline schema
    schemaSql = getInlineSchema();
  }

  db.exec(schemaSql);
}

function getInlineSchema(): string {
  return `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  agent TEXT,
  command TEXT,
  cwd TEXT,
  git_branch TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  data_json TEXT NOT NULL,
  hash TEXT NOT NULL,
  prev_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  event_id INTEGER REFERENCES events(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  tags_json TEXT,
  timestamp TEXT NOT NULL,
  hash TEXT NOT NULL,
  prev_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  event_id INTEGER REFERENCES events(id),
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL,
  diff TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_annotations_session ON annotations(session_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_session ON file_changes(session_id);
  `;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
