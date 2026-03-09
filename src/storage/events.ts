import { getDb } from './db.js';
import { appendToChain } from './hash-chain.js';

export interface Event {
  id: number;
  session_id: string;
  type: string;
  timestamp: string;
  data_json: string;
  hash: string;
  prev_hash: string | null;
  created_at: string;
}

export function appendEvent(params: {
  session_id: string;
  type: string;
  timestamp?: string;
  data: Record<string, unknown>;
}): Event {
  const db = getDb();
  const timestamp = params.timestamp ?? new Date().toISOString();
  const dataJson = JSON.stringify(params.data);
  const { hash, prevHash } = appendToChain(params.type, timestamp, dataJson);

  const result = db.prepare(`
    INSERT INTO events (session_id, type, timestamp, data_json, hash, prev_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    params.session_id,
    params.type,
    timestamp,
    dataJson,
    hash,
    prevHash,
  );

  return db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid) as Event;
}

export function getEvents(params: {
  session_id?: string;
  type?: string;
  since?: string;
  search?: string;
  limit?: number;
}): Event[] {
  const db = getDb();
  const conditions: string[] = [];
  const args: unknown[] = [];

  if (params.session_id) {
    conditions.push(`session_id = ?`);
    args.push(params.session_id);
  }

  if (params.type) {
    conditions.push(`type = ?`);
    args.push(params.type);
  }

  if (params.since) {
    conditions.push(`timestamp >= ?`);
    args.push(params.since);
  }

  if (params.search) {
    // Split search into words — all words must match (AND)
    const words = params.search.trim().split(/\s+/).filter(w => w.length > 0);
    for (const w of words) {
      conditions.push(`data_json LIKE ?`);
      args.push(`%${w}%`);
    }
  }

  let query = `SELECT * FROM events`;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  // Use DESC + LIMIT to get the most recent events, then reverse for chronological display
  query += ` ORDER BY id DESC`;

  if (params.limit) {
    query += ` LIMIT ?`;
    args.push(params.limit);
  }

  const rows = db.prepare(query).all(...args) as Event[];
  return rows.reverse();
}

export function getEventCountsByType(sessionId: string): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    `SELECT type, COUNT(*) as count FROM events WHERE session_id = ? GROUP BY type`
  ).all(sessionId) as Array<{ type: string; count: number }>;

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.type] = row.count;
  }
  return counts;
}
