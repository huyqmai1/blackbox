/**
 * Agent Registry
 *
 * Central registry for all agent adapters. Enables multi-agent ingestion
 * by providing a single entry point to discover sessions across all agents.
 */

import type { AgentAdapter, DiscoveredSession } from './agent-adapter.js';
import { claudeCodeAdapter } from './claude-code.js';
import { openClawAdapter } from './openclaw.js';

const ADAPTERS: Map<string, AgentAdapter> = new Map();

export function registerAdapter(adapter: AgentAdapter): void {
  ADAPTERS.set(adapter.name, adapter);
}

export function getAdapter(name: string): AgentAdapter | undefined {
  return ADAPTERS.get(name);
}

export function getAllAdapters(): AgentAdapter[] {
  return Array.from(ADAPTERS.values());
}

export function getAdapterNames(): string[] {
  return Array.from(ADAPTERS.keys());
}

export function discoverAllSessions(since?: string): DiscoveredSession[] {
  const allSessions: DiscoveredSession[] = [];

  for (const adapter of ADAPTERS.values()) {
    try {
      allSessions.push(...adapter.discoverSessions(since));
    } catch (e) {
      console.warn(`Adapter ${adapter.name} discovery failed:`, e instanceof Error ? e.message : String(e));
    }
  }

  return allSessions.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
}

// Register built-in adapters
registerAdapter(claudeCodeAdapter);
registerAdapter(openClawAdapter);
