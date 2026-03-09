import { createHash } from 'node:crypto';
import { getDb } from './db.js';

const GENESIS_VALUE = 'blackbox-genesis';

// In-memory cache for the last hash to avoid timestamp precision issues
// when multiple items are inserted in rapid succession
let _lastHashCache: string | null = null;

export function genesisHash(): string {
  return sha256(GENESIS_VALUE);
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function computeHash(prevHash: string, type: string, timestamp: string, dataJson: string): string {
  return sha256(`${prevHash}|${type}|${timestamp}|${dataJson}`);
}

export function getLastHash(): string {
  const db = getDb();

  // Check events table for the latest hash (by rowid/id)
  const lastEvent = db.prepare(
    `SELECT hash FROM events ORDER BY id DESC LIMIT 1`
  ).get() as { hash: string } | undefined;

  // Check annotations table for the latest hash
  const lastAnnotation = db.prepare(
    `SELECT hash, created_at FROM annotations ORDER BY created_at DESC LIMIT 1`
  ).get() as { hash: string; created_at: string } | undefined;

  if (lastEvent && lastAnnotation) {
    // Compare by created_at to find the truly latest entry
    const eventRow = db.prepare(
      `SELECT created_at FROM events ORDER BY id DESC LIMIT 1`
    ).get() as { created_at: string };

    if (eventRow.created_at >= lastAnnotation.created_at) {
      return lastEvent.hash;
    }
    return lastAnnotation.hash;
  }

  if (lastEvent) return lastEvent.hash;
  if (lastAnnotation) return lastAnnotation.hash;

  return genesisHash();
}

export function appendToChain(type: string, timestamp: string, dataJson: string): { hash: string; prevHash: string } {
  const prevHash = _lastHashCache ?? getLastHash();
  const hash = computeHash(prevHash, type, timestamp, dataJson);
  _lastHashCache = hash;
  return { hash, prevHash };
}

export function resetHashCache(): void {
  _lastHashCache = null;
}

export function verifyChain(): { valid: boolean; brokenAt?: number; details?: string } {
  const db = getDb();

  // Get all events in order
  const events = db.prepare(
    `SELECT id, type, timestamp, data_json, hash, prev_hash FROM events ORDER BY id ASC`
  ).all() as Array<{
    id: number;
    type: string;
    timestamp: string;
    data_json: string;
    hash: string;
    prev_hash: string | null;
  }>;

  if (events.length === 0) {
    return { valid: true };
  }

  // First event should chain from genesis
  const genesis = genesisHash();
  const firstExpected = computeHash(genesis, events[0].type, events[0].timestamp, events[0].data_json);

  if (events[0].prev_hash !== genesis) {
    return { valid: false, brokenAt: events[0].id, details: 'First event does not chain from genesis hash' };
  }

  if (events[0].hash !== firstExpected) {
    return { valid: false, brokenAt: events[0].id, details: 'First event hash mismatch' };
  }

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];

    if (curr.prev_hash !== prev.hash) {
      return { valid: false, brokenAt: curr.id, details: `Event ${curr.id} prev_hash doesn't match previous event's hash` };
    }

    const expected = computeHash(curr.prev_hash, curr.type, curr.timestamp, curr.data_json);
    if (curr.hash !== expected) {
      return { valid: false, brokenAt: curr.id, details: `Event ${curr.id} hash mismatch` };
    }
  }

  return { valid: true };
}
