import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

export interface ClaudeCodeEntry {
  type: string;
  message?: {
    role?: string;
    content?: unknown;
    model?: string;
  };
  parentMessageId?: string;
  timestamp?: string;
  cwd?: string;
  sessionId?: string;
  version?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ParsedSession {
  sourceSessionId: string;
  projectSlug: string;
  entries: ClaudeCodeEntry[];
  startedAt: string;
  endedAt: string;
  cwd?: string;
  model?: string;
  gitBranch?: string;
}

export function getClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

export function discoverSessions(since?: string): Array<{ projectSlug: string; sessionFile: string; sessionId: string; mtime: Date }> {
  const projectsDir = getClaudeProjectsDir();
  if (!existsSync(projectsDir)) return [];

  const results: Array<{ projectSlug: string; sessionFile: string; sessionId: string; mtime: Date }> = [];

  const projectSlugs = readdirSync(projectsDir).filter(f => {
    const stat = statSync(join(projectsDir, f));
    return stat.isDirectory();
  });

  for (const slug of projectSlugs) {
    const projectDir = join(projectsDir, slug);
    const files = readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = join(projectDir, file);
      const stat = statSync(filePath);

      if (since && stat.mtime < new Date(since)) continue;

      const sessionId = basename(file, '.jsonl');
      results.push({
        projectSlug: slug,
        sessionFile: filePath,
        sessionId,
        mtime: stat.mtime,
      });
    }
  }

  return results.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
}

export function parseSessionFile(filePath: string): ClaudeCodeEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const entries: ClaudeCodeEntry[] = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

export function parseSession(projectSlug: string, filePath: string, sessionId: string): ParsedSession {
  const entries = parseSessionFile(filePath);

  let startedAt = new Date().toISOString();
  let endedAt = startedAt;
  let cwd: string | undefined;
  let model: string | undefined;

  // Extract metadata from entries
  for (const entry of entries) {
    if (entry.timestamp) {
      const ts = entry.timestamp;
      if (ts < startedAt || startedAt === endedAt) startedAt = ts;
      if (ts > endedAt) endedAt = ts;
    }

    if (entry.cwd && !cwd) cwd = entry.cwd;

    if (entry.message?.model && !model) model = entry.message.model;
  }

  // Try to infer timestamps from entries if not directly available
  if (entries.length > 0) {
    // Some entries may have a top-level timestamp
    const timestamps = entries
      .map(e => e.timestamp)
      .filter((t): t is string => !!t)
      .sort();

    if (timestamps.length > 0) {
      startedAt = timestamps[0];
      endedAt = timestamps[timestamps.length - 1];
    }
  }

  return {
    sourceSessionId: sessionId,
    projectSlug,
    entries,
    startedAt,
    endedAt,
    cwd,
    model,
  };
}

export interface MappedEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function mapEntryToEvents(entry: ClaudeCodeEntry): MappedEvent[] {
  const events: MappedEvent[] = [];
  const timestamp = entry.timestamp ?? new Date().toISOString();

  if (entry.type === 'user' || (entry.message?.role === 'user')) {
    const content = extractTextContent(entry.message?.content);
    if (content) {
      events.push({
        type: 'user_prompt',
        timestamp,
        data: { content, raw_type: entry.type },
      });
    }
    return events;
  }

  if (entry.type === 'assistant' || (entry.message?.role === 'assistant')) {
    const content = entry.message?.content;

    if (Array.isArray(content)) {
      // Process each content block
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          events.push({
            type: 'ai_response',
            timestamp,
            data: {
              content: block.text,
              model: entry.message?.model,
              raw_type: entry.type,
            },
          });
        } else if (block.type === 'tool_use') {
          events.push({
            type: 'tool_use',
            timestamp,
            data: {
              tool_name: block.name,
              tool_input: block.input,
              tool_id: block.id,
              raw_type: entry.type,
            },
          });
        } else if (block.type === 'tool_result') {
          events.push({
            type: 'tool_result',
            timestamp,
            data: {
              tool_use_id: block.tool_use_id,
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
              is_error: block.is_error,
              raw_type: entry.type,
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
          data: { content: text, model: entry.message?.model, raw_type: entry.type },
        });
      }
    }

    return events;
  }

  if (entry.type === 'tool_result' || entry.type === 'tool-result') {
    const content = extractTextContent(entry.message?.content);
    events.push({
      type: 'tool_result',
      timestamp,
      data: {
        content: content ?? '',
        raw_type: entry.type,
      },
    });
    return events;
  }

  // Fallback: capture as a generic event
  if (entry.type) {
    events.push({
      type: entry.type,
      timestamp,
      data: { raw: entry },
    });
  }

  return events;
}

function extractTextContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const texts = content
      .filter((b: { type?: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text);
    return texts.length > 0 ? texts.join('\n') : null;
  }
  return null;
}
