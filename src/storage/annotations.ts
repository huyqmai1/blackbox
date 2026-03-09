import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { appendToChain } from './hash-chain.js';

export type AnnotationType = 'risk_flag' | 'decision_note' | 'override_record' | 'constraint_note';

export const ANNOTATION_TYPES: AnnotationType[] = [
  'risk_flag',
  'decision_note',
  'override_record',
  'constraint_note',
];

export interface Annotation {
  id: string;
  session_id: string | null;
  event_id: number | null;
  type: string;
  content: string;
  tags_json: string | null;
  timestamp: string;
  hash: string;
  prev_hash: string | null;
  created_at: string;
}

export function createAnnotation(params: {
  session_id: string;
  event_id?: number;
  type: AnnotationType;
  content: string;
  tags?: string[];
  timestamp?: string;
}): Annotation {
  const db = getDb();
  const id = randomUUID();
  const timestamp = params.timestamp ?? new Date().toISOString();
  const tagsJson = params.tags ? JSON.stringify(params.tags) : null;

  const dataForHash = JSON.stringify({
    type: params.type,
    content: params.content,
    tags: params.tags,
  });
  const { hash, prevHash } = appendToChain(params.type, timestamp, dataForHash);

  db.prepare(`
    INSERT INTO annotations (id, session_id, event_id, type, content, tags_json, timestamp, hash, prev_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.session_id,
    params.event_id ?? null,
    params.type,
    params.content,
    tagsJson,
    timestamp,
    hash,
    prevHash,
  );

  return db.prepare(`SELECT * FROM annotations WHERE id = ?`).get(id) as Annotation;
}

export function getAnnotations(params: {
  session_id?: string;
  type?: string;
  since?: string;
  limit?: number;
}): Annotation[] {
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

  let query = `SELECT * FROM annotations`;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ` ORDER BY timestamp ASC`;

  if (params.limit) {
    query += ` LIMIT ?`;
    args.push(params.limit);
  }

  return db.prepare(query).all(...args) as Annotation[];
}

export function getAnnotationCountBySession(sessionId: string): number {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as count FROM annotations WHERE session_id = ?`
  ).get(sessionId) as { count: number };
  return row.count;
}
