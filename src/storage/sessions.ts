import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';

export interface Session {
  id: string;
  source: string;
  agent: string | null;
  command: string | null;
  cwd: string | null;
  git_branch: string | null;
  started_at: string;
  ended_at: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface SessionWithStats extends Session {
  event_count: number;
}

export function createSession(params: {
  source: string;
  agent?: string;
  command?: string;
  cwd?: string;
  git_branch?: string;
  started_at?: string;
  metadata_json?: string;
}): Session {
  const db = getDb();
  const id = randomUUID();
  const started_at = params.started_at ?? new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (id, source, agent, command, cwd, git_branch, started_at, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.source,
    params.agent ?? null,
    params.command ?? null,
    params.cwd ?? null,
    params.git_branch ?? null,
    started_at,
    params.metadata_json ?? null,
  );

  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as Session;
}

export function endSession(id: string, ended_at?: string): void {
  const db = getDb();
  db.prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`)
    .run(ended_at ?? new Date().toISOString(), id);
}

export function getSession(id: string): Session | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as Session | undefined;
}

export function listSessions(params?: {
  since?: string;
  limit?: number;
}): SessionWithStats[] {
  const db = getDb();
  const limit = params?.limit ?? 20;

  let query = `
    SELECT s.*, COUNT(e.id) as event_count
    FROM sessions s
    LEFT JOIN events e ON e.session_id = s.id
  `;

  const args: unknown[] = [];

  if (params?.since) {
    query += ` WHERE s.started_at >= ?`;
    args.push(params.since);
  }

  query += ` GROUP BY s.id ORDER BY s.started_at DESC LIMIT ?`;
  args.push(limit);

  return db.prepare(query).all(...args) as SessionWithStats[];
}

export function sessionExistsBySourceId(sourceSessionId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    `SELECT 1 FROM sessions WHERE metadata_json LIKE ?`
  ).get(`%"source_session_id":"${sourceSessionId}"%`);
  return !!row;
}
