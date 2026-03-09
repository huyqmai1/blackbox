import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

// Set up temp DB before any imports that use getDb()
const TEST_DIR = join(tmpdir(), `blackbox-test-${randomUUID()}`);
process.env.BLACKBOX_DIR = TEST_DIR;

import { createAnnotation, getAnnotations, getAnnotationCountBySession, ANNOTATION_TYPES } from '../src/storage/annotations.js';
import { createSession } from '../src/storage/sessions.js';
import { appendEvent } from '../src/storage/events.js';
import { closeDb } from '../src/storage/db.js';

let testSessionId: string;

beforeAll(() => {
  mkdirSync(TEST_DIR, { recursive: true });

  // Create a test session
  const session = createSession({
    source: 'test',
    agent: 'test-agent',
    cwd: '/tmp/test',
  });
  testSessionId = session.id;

  // Add a test event so the hash chain has something
  appendEvent({
    session_id: testSessionId,
    type: 'session_start',
    data: { source: 'test' },
  });
});

afterAll(() => {
  closeDb();
  try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe('annotations', () => {
  describe('createAnnotation', () => {
    it('creates a risk_flag annotation', () => {
      const annotation = createAnnotation({
        session_id: testSessionId,
        type: 'risk_flag',
        content: 'Not confident in error handling',
      });

      expect(annotation.id).toBeTruthy();
      expect(annotation.session_id).toBe(testSessionId);
      expect(annotation.type).toBe('risk_flag');
      expect(annotation.content).toBe('Not confident in error handling');
      expect(annotation.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(annotation.prev_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('creates a decision_note annotation', () => {
      const annotation = createAnnotation({
        session_id: testSessionId,
        type: 'decision_note',
        content: 'Chose REST over GraphQL for simplicity',
      });

      expect(annotation.type).toBe('decision_note');
      expect(annotation.content).toBe('Chose REST over GraphQL for simplicity');
    });

    it('creates an override_record annotation', () => {
      const annotation = createAnnotation({
        session_id: testSessionId,
        type: 'override_record',
        content: 'Manager asked to ship without load testing',
      });

      expect(annotation.type).toBe('override_record');
    });

    it('creates a constraint_note annotation', () => {
      const annotation = createAnnotation({
        session_id: testSessionId,
        type: 'constraint_note',
        content: 'Deadline moved up by 2 weeks',
      });

      expect(annotation.type).toBe('constraint_note');
    });

    it('stores tags when provided', () => {
      const annotation = createAnnotation({
        session_id: testSessionId,
        type: 'risk_flag',
        content: 'Untested edge case',
        tags: ['backend', 'auth'],
      });

      expect(annotation.tags_json).toBe('["backend","auth"]');
    });

    it('chains hashes correctly across annotations', () => {
      const a1 = createAnnotation({
        session_id: testSessionId,
        type: 'risk_flag',
        content: 'First',
      });

      const a2 = createAnnotation({
        session_id: testSessionId,
        type: 'decision_note',
        content: 'Second',
      });

      // a2's prev_hash should be a1's hash
      expect(a2.prev_hash).toBe(a1.hash);
      expect(a2.hash).not.toBe(a1.hash);
    });
  });

  describe('getAnnotations', () => {
    it('retrieves annotations by session_id', () => {
      const annotations = getAnnotations({ session_id: testSessionId });
      expect(annotations.length).toBeGreaterThanOrEqual(6);
      expect(annotations.every(a => a.session_id === testSessionId)).toBe(true);
    });

    it('filters by type', () => {
      const riskFlags = getAnnotations({ session_id: testSessionId, type: 'risk_flag' });
      expect(riskFlags.length).toBeGreaterThanOrEqual(2);
      expect(riskFlags.every(a => a.type === 'risk_flag')).toBe(true);
    });

    it('respects limit', () => {
      const annotations = getAnnotations({ session_id: testSessionId, limit: 2 });
      expect(annotations).toHaveLength(2);
    });

    it('returns empty array for non-existent session', () => {
      const annotations = getAnnotations({ session_id: 'non-existent' });
      expect(annotations).toHaveLength(0);
    });
  });

  describe('getAnnotationCountBySession', () => {
    it('returns correct count', () => {
      const count = getAnnotationCountBySession(testSessionId);
      expect(count).toBeGreaterThanOrEqual(6);
    });

    it('returns 0 for non-existent session', () => {
      const count = getAnnotationCountBySession('non-existent');
      expect(count).toBe(0);
    });
  });

  describe('ANNOTATION_TYPES', () => {
    it('contains all four types', () => {
      expect(ANNOTATION_TYPES).toEqual([
        'risk_flag',
        'decision_note',
        'override_record',
        'constraint_note',
      ]);
    });
  });
});
