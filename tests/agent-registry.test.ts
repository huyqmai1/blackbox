import { describe, it, expect } from 'vitest';
import { getAdapter, getAllAdapters, getAdapterNames } from '../src/ingest/registry.js';

describe('agent-registry', () => {
  it('has claude-code adapter registered', () => {
    const adapter = getAdapter('claude-code');
    expect(adapter).toBeDefined();
    expect(adapter!.name).toBe('claude-code');
    expect(adapter!.displayName).toBe('Claude Code');
  });

  it('has openclaw adapter registered', () => {
    const adapter = getAdapter('openclaw');
    expect(adapter).toBeDefined();
    expect(adapter!.name).toBe('openclaw');
    expect(adapter!.displayName).toBe('OpenClaw');
  });

  it('returns undefined for unknown adapter', () => {
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('lists all registered adapters', () => {
    const adapters = getAllAdapters();
    expect(adapters.length).toBeGreaterThanOrEqual(2);
    const names = adapters.map(a => a.name);
    expect(names).toContain('claude-code');
    expect(names).toContain('openclaw');
  });

  it('lists adapter names', () => {
    const names = getAdapterNames();
    expect(names).toContain('claude-code');
    expect(names).toContain('openclaw');
  });

  it('all adapters implement required methods', () => {
    for (const adapter of getAllAdapters()) {
      expect(typeof adapter.discoverSessions).toBe('function');
      expect(typeof adapter.parseSession).toBe('function');
      expect(typeof adapter.mapEntryToEvents).toBe('function');
    }
  });

  it('claude-code adapter has isInternalSession', () => {
    const adapter = getAdapter('claude-code');
    expect(typeof adapter!.isInternalSession).toBe('function');
  });

  it('openclaw adapter does not have isInternalSession', () => {
    const adapter = getAdapter('openclaw');
    expect(adapter!.isInternalSession).toBeUndefined();
  });
});
