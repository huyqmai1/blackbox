/**
 * OpenClaw Agent Adapter
 *
 * Ingests session JSONL files from OpenClaw (https://openclaw.ai).
 * Session files live at ~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl
 *
 * OpenClaw JSONL format (each line is one of):
 *   - Session header: { type: "session", version, id, timestamp, cwd }
 *   - Message entry:  { type: "message", id, parentId, timestamp, message: { role, content, ... } }
 *   - Compaction:     { type: "compaction", summary, ... }
 *   - Model change:   { type: "model_change", provider, modelId, ... }
 *   - And others:     thinking_level_change, branch_summary, custom, custom_message, label, session_info
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import type { AgentAdapter, DiscoveredSession, ParsedSession, MappedEvent } from './agent-adapter.js';

// --- Types for OpenClaw JSONL entries ---

export interface OpenClawEntry {
  type: string;
  id?: string;
  parentId?: string | null;
  timestamp?: string;

  // Session header fields
  version?: number;
  cwd?: string;
  parentSession?: string;

  // Message entry
  message?: {
    role?: string;
    content?: unknown;
    api?: string;
    provider?: string;
    model?: string;
    usage?: {
      input: number;
      output: number;
      cacheRead: number;
      cacheWrite: number;
      totalTokens: number;
      cost: { input: number; output: number; cacheRead?: number; cacheWrite?: number; total: number };
    };
    stopReason?: string;
    timestamp?: number; // epoch ms
    toolCallId?: string;
    toolName?: string;
    isError?: boolean;
    details?: unknown;
  };

  // Model change fields
  provider?: string;
  modelId?: string;

  // Compaction fields
  summary?: string;
  firstKeptEntryId?: string;
  tokensBefore?: number;

  // Custom entry fields
  customType?: string;
  data?: unknown;

  // Custom message fields
  content?: unknown;
  display?: boolean;

  // Session info fields
  name?: string;

  // Label fields
  targetId?: string;
  label?: string;

  // Thinking level change
  thinkingLevel?: string;
}

// --- Helpers ---

function getOpenClawBaseDir(): string {
  return process.env.OPENCLAW_STATE_DIR || join(homedir(), '.openclaw');
}

function parseJsonlFile(filePath: string): OpenClawEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const entries: OpenClawEntry[] = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

/** Convert epoch ms or ISO string to ISO 8601 */
function normalizeTimestamp(entry: OpenClawEntry): string {
  // Prefer outer ISO timestamp
  if (entry.timestamp) return entry.timestamp;
  // Fall back to message epoch ms
  if (entry.message?.timestamp) {
    return new Date(entry.message.timestamp).toISOString();
  }
  return new Date().toISOString();
}

/** Extract text content from OpenClaw message content field */
function extractTextContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const texts = content
      .filter((b: { type?: string }) => b.type === 'text')
      .map((b: { text?: string }) => b.text ?? '')
      .filter(t => t.length > 0);
    return texts.length > 0 ? texts.join('\n') : null;
  }
  return null;
}

// --- Discovery ---

function discoverOpenClawSessions(since?: string): DiscoveredSession[] {
  const baseDir = getOpenClawBaseDir();
  const agentsDir = join(baseDir, 'agents');
  if (!existsSync(agentsDir)) return [];

  const results: DiscoveredSession[] = [];
  const sinceDate = since ? new Date(since) : undefined;

  let agentDirs: string[];
  try {
    agentDirs = readdirSync(agentsDir).filter(f => {
      try { return statSync(join(agentsDir, f)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }

  for (const agentId of agentDirs) {
    const sessionsDir = join(agentsDir, agentId, 'sessions');
    if (!existsSync(sessionsDir)) continue;

    let files: string[];
    try {
      files = readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    } catch { continue; }

    for (const file of files) {
      // Skip archived/backup files
      if (/\.(bak|reset|deleted)\./.test(file)) continue;

      const filePath = join(sessionsDir, file);
      let stat;
      try { stat = statSync(filePath); } catch { continue; }

      if (sinceDate && stat.mtime < sinceDate) continue;

      const sessionId = basename(file, '.jsonl');
      results.push({
        agentName: 'openclaw',
        sourceSessionId: sessionId,
        sessionFile: filePath,
        projectSlug: agentId, // Will be refined in parseSession from cwd
        mtime: stat.mtime,
      });
    }
  }

  return results.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
}

// --- Parsing ---

function parseOpenClawSession(discovered: DiscoveredSession): ParsedSession {
  const entries = parseJsonlFile(discovered.sessionFile);

  const fileMtime = statSync(discovered.sessionFile).mtime.toISOString();
  let startedAt = fileMtime;
  let endedAt = fileMtime;
  let cwd: string | undefined;
  let model: string | undefined;
  let projectSlug = discovered.projectSlug;

  // Extract metadata
  for (const entry of entries) {
    // Session header
    if (entry.type === 'session') {
      if (entry.cwd) cwd = entry.cwd;
      if (entry.timestamp) startedAt = entry.timestamp;
    }

    // Collect timestamps
    const ts = normalizeTimestamp(entry);
    if (ts < startedAt) startedAt = ts;
    if (ts > endedAt) endedAt = ts;

    // Extract model from assistant messages
    if (entry.type === 'message' && entry.message?.role === 'assistant' && entry.message?.model && !model) {
      model = entry.message.model;
    }
  }

  // Derive project slug from cwd if available
  if (cwd) {
    const parts = cwd.replace(/\/+$/, '').split('/');
    const dirName = parts[parts.length - 1];
    if (dirName) projectSlug = dirName;
  }

  return {
    sourceSessionId: discovered.sourceSessionId,
    projectSlug,
    entries,
    startedAt,
    endedAt,
    cwd,
    model,
  };
}

// --- Event Mapping ---

function mapOpenClawEntryToEvents(entry: unknown): MappedEvent[] {
  const e = entry as OpenClawEntry;
  const events: MappedEvent[] = [];
  const timestamp = normalizeTimestamp(e);

  // Session header -> session_start
  if (e.type === 'session') {
    events.push({
      type: 'session_start',
      timestamp,
      data: {
        cwd: e.cwd,
        version: e.version,
        raw_type: 'session',
      },
    });
    return events;
  }

  // Message entries
  if (e.type === 'message' && e.message) {
    const msg = e.message;

    // User message
    if (msg.role === 'user') {
      const content = extractTextContent(msg.content);
      if (content) {
        events.push({
          type: 'user_prompt',
          timestamp,
          data: { content, raw_type: 'message' },
        });
      }
      return events;
    }

    // Assistant message — split content blocks
    if (msg.role === 'assistant') {
      const content = msg.content;
      if (Array.isArray(content)) {
        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === 'text' && block.text) {
            events.push({
              type: 'ai_response',
              timestamp,
              data: {
                content: block.text,
                model: msg.model,
                provider: msg.provider,
                raw_type: 'message',
              },
            });
          } else if (block.type === 'thinking' && block.thinking) {
            events.push({
              type: 'ai_response',
              timestamp,
              data: {
                content: block.thinking,
                model: msg.model,
                is_thinking: true,
                raw_type: 'message',
              },
            });
          } else if (block.type === 'toolCall') {
            events.push({
              type: 'tool_use',
              timestamp,
              data: {
                tool_name: block.name as string,
                tool_input: block.arguments as Record<string, unknown>,
                tool_id: block.id as string,
                model: msg.model,
                raw_type: 'message',
              },
            });
          }
        }
      } else {
        const text = extractTextContent(content);
        if (text) {
          events.push({
            type: 'ai_response',
            timestamp,
            data: { content: text, model: msg.model, raw_type: 'message' },
          });
        }
      }

      return events;
    }

    // Tool result message
    if (msg.role === 'toolResult') {
      const content = extractTextContent(msg.content);
      events.push({
        type: 'tool_result',
        timestamp,
        data: {
          tool_use_id: msg.toolCallId,
          tool_name: msg.toolName,
          content: content ?? '',
          is_error: msg.isError ?? false,
          raw_type: 'message',
        },
      });
      return events;
    }
  }

  // Session info -> can be used for title
  if (e.type === 'session_info' && e.name) {
    events.push({
      type: 'session_info',
      timestamp,
      data: { name: e.name, raw_type: 'session_info' },
    });
    return events;
  }

  // Skip internal housekeeping types
  const SKIP_TYPES = new Set([
    'compaction',
    'branch_summary',
    'model_change',
    'thinking_level_change',
    'custom',
    'custom_message',
    'label',
  ]);
  if (e.type && SKIP_TYPES.has(e.type)) {
    return events;
  }

  return events;
}

// --- Adapter Export ---

export const openClawAdapter: AgentAdapter = {
  name: 'openclaw',
  displayName: 'OpenClaw',
  discoverSessions: discoverOpenClawSessions,
  parseSession: parseOpenClawSession,
  mapEntryToEvents: mapOpenClawEntryToEvents,
  // OpenClaw does not have "internal" sessions that need filtering
};
