import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

// We need to mock the DB path for tests
// Set up a temp directory for test DB
const TEST_DIR = join(tmpdir(), `blackbox-test-${randomUUID()}`);
const TEST_DB_PATH = join(TEST_DIR, 'blackbox.db');

// We'll test hash functions directly since they're pure functions
import { sha256, computeHash, genesisHash } from '../src/storage/hash-chain.js';

describe('hash-chain', () => {
  describe('sha256', () => {
    it('produces consistent hashes', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('hello');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('world');
      expect(hash1).not.toBe(hash2);
    });

    it('produces 64-character hex strings', () => {
      const hash = sha256('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('genesisHash', () => {
    it('is deterministic', () => {
      expect(genesisHash()).toBe(genesisHash());
    });

    it('is SHA-256 of "blackbox-genesis"', () => {
      expect(genesisHash()).toBe(sha256('blackbox-genesis'));
    });
  });

  describe('computeHash', () => {
    it('chains correctly', () => {
      const genesis = genesisHash();
      const hash1 = computeHash(genesis, 'session_start', '2024-01-01T00:00:00Z', '{}');
      const hash2 = computeHash(hash1, 'user_prompt', '2024-01-01T00:01:00Z', '{"content":"hello"}');

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(genesis);
    });

    it('is deterministic', () => {
      const genesis = genesisHash();
      const h1 = computeHash(genesis, 'test', '2024-01-01T00:00:00Z', '{"a":1}');
      const h2 = computeHash(genesis, 'test', '2024-01-01T00:00:00Z', '{"a":1}');
      expect(h1).toBe(h2);
    });

    it('changes with different type', () => {
      const genesis = genesisHash();
      const h1 = computeHash(genesis, 'type_a', '2024-01-01T00:00:00Z', '{}');
      const h2 = computeHash(genesis, 'type_b', '2024-01-01T00:00:00Z', '{}');
      expect(h1).not.toBe(h2);
    });

    it('changes with different timestamp', () => {
      const genesis = genesisHash();
      const h1 = computeHash(genesis, 'test', '2024-01-01T00:00:00Z', '{}');
      const h2 = computeHash(genesis, 'test', '2024-01-01T00:01:00Z', '{}');
      expect(h1).not.toBe(h2);
    });

    it('changes with different data', () => {
      const genesis = genesisHash();
      const h1 = computeHash(genesis, 'test', '2024-01-01T00:00:00Z', '{"a":1}');
      const h2 = computeHash(genesis, 'test', '2024-01-01T00:00:00Z', '{"a":2}');
      expect(h1).not.toBe(h2);
    });
  });
});
