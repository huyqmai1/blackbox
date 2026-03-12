/**
 * Agent Adapter Interface
 *
 * Pluggable contract for ingesting sessions from different AI agents.
 * Each agent (Claude Code, OpenClaw, etc.) implements this interface
 * to enable unified ingestion into BlackBox.
 */

export interface DiscoveredSession {
  /** Agent identifier, e.g. 'claude-code', 'openclaw' */
  agentName: string;
  /** Unique session ID within the agent's own system */
  sourceSessionId: string;
  /** Absolute path to the session JSONL file */
  sessionFile: string;
  /** Human-readable project/context identifier */
  projectSlug: string;
  /** File modification time */
  mtime: Date;
}

export interface ParsedSession {
  sourceSessionId: string;
  projectSlug: string;
  entries: unknown[];
  startedAt: string;
  endedAt: string;
  cwd?: string;
  model?: string;
  gitBranch?: string;
}

export interface MappedEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface AgentAdapter {
  /** Unique slug: 'claude-code', 'openclaw', etc. */
  readonly name: string;
  /** Human-friendly display name: 'Claude Code', 'OpenClaw', etc. */
  readonly displayName: string;

  /** Discover session files on disk, optionally filtered by date. */
  discoverSessions(since?: string): DiscoveredSession[];

  /** Parse a discovered session file into structured data. */
  parseSession(discovered: DiscoveredSession): ParsedSession;

  /** Map a single raw entry to zero or more unified BlackBox events. */
  mapEntryToEvents(entry: unknown): MappedEvent[];

  /** Detect sessions that are internal/meta (e.g., enrichment sessions). Optional. */
  isInternalSession?(entries: unknown[]): boolean;
}
