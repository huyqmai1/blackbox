import { execSync } from 'node:child_process';
import { getEvents } from '../storage/events.js';
import { getDb } from '../storage/db.js';
import { createAnnotation, type AnnotationType } from '../storage/annotations.js';

interface AiEnrichResult {
  title: string;
  summary: string;
  annotations: Array<{
    type: string;
    content: string;
  }>;
}

function buildSessionSummary(sessionId: string): string {
  const events = getEvents({ session_id: sessionId });
  const parts: string[] = [];

  // Session metadata
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as {
    cwd: string | null; metadata_json: string | null; started_at: string; ended_at: string | null;
  } | undefined;

  if (session) {
    const meta = session.metadata_json ? JSON.parse(session.metadata_json) : {};
    parts.push(`Project: ${meta.project_slug || session.cwd || 'unknown'}`);
    parts.push(`Started: ${session.started_at}`);
    if (session.ended_at) parts.push(`Ended: ${session.ended_at}`);
  }

  parts.push(`Total events: ${events.length}`);
  parts.push('');

  // User prompts (full)
  const prompts = events.filter(e => e.type === 'user_prompt');
  for (const p of prompts) {
    try {
      const data = JSON.parse(p.data_json);
      const content = String(data.content || '').trim();
      if (content && !content.startsWith('<')) {
        parts.push(`[User] ${content.slice(0, 500)}`);
      }
    } catch { /* skip */ }
  }
  parts.push('');

  // AI responses (truncated)
  const responses = events.filter(e => e.type === 'ai_response').slice(0, 5);
  for (const r of responses) {
    try {
      const data = JSON.parse(r.data_json);
      const content = String(data.content || '').trim();
      if (content) parts.push(`[AI] ${content.slice(0, 300)}`);
    } catch { /* skip */ }
  }
  parts.push('');

  // Tool usage summary
  const toolUses = events.filter(e => e.type === 'tool_use');
  const toolCounts: Record<string, number> = {};
  const bashCommands: string[] = [];
  const filesModified: string[] = [];

  for (const t of toolUses) {
    try {
      const data = JSON.parse(t.data_json);
      const name = data.tool_name || 'unknown';
      toolCounts[name] = (toolCounts[name] || 0) + 1;
      if (name === 'Bash' && data.tool_input?.command) {
        bashCommands.push(String(data.tool_input.command).slice(0, 150));
      }
      if (['Write', 'Edit'].includes(name) && data.tool_input?.file_path) {
        filesModified.push(data.tool_input.file_path);
      }
    } catch { /* skip */ }
  }

  if (Object.keys(toolCounts).length > 0) {
    parts.push('Tools used: ' + Object.entries(toolCounts).map(([k, v]) => `${k}(${v})`).join(', '));
  }
  if (filesModified.length > 0) {
    const unique = [...new Set(filesModified)];
    parts.push(`Files modified (${unique.length}): ${unique.slice(0, 20).join(', ')}`);
  }
  if (bashCommands.length > 0) {
    parts.push('Key commands:');
    for (const cmd of bashCommands.slice(0, 10)) {
      parts.push(`  $ ${cmd}`);
    }
  }

  // Errors
  const errors = events.filter(e => {
    if (e.type !== 'tool_result') return false;
    try { return JSON.parse(e.data_json).is_error; } catch { return false; }
  });
  if (errors.length > 0) {
    parts.push(`Errors encountered: ${errors.length}`);
  }

  // Trim to reasonable size for Claude context
  const full = parts.join('\n');
  if (full.length > 8000) return full.slice(0, 8000) + '\n...(truncated)';
  return full;
}

function callClaude(prompt: string): string {
  try {
    // Remove CLAUDECODE env var to allow spawning claude inside an existing session
    const env = { ...process.env };
    delete env.CLAUDECODE;

    const result = execSync(
      `claude -p ${JSON.stringify(prompt)} --output-format text --max-turns 1`,
      { encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'], env }
    );
    return result.trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude CLI failed: ${msg}`);
  }
}

export function aiEnrichSession(sessionId: string): AiEnrichResult {
  const summary = buildSessionSummary(sessionId);

  const prompt = `You are analyzing an AI coding assistant session log. Based on the session data below, return ONLY valid JSON (no markdown, no code fences) with:
- "title": a concise 3-8 word title describing what was accomplished
- "summary": a 1-2 sentence summary of the session
- "annotations": array of objects with "type" (one of: risk_flag, decision_note) and "content" (concise description), identifying key architectural decisions, risks taken, or notable patterns. Only include genuinely important items, not trivial observations. Return an empty array if nothing notable.

Session data:
${summary}`;

  const raw = callClaude(prompt);

  // Parse JSON — handle potential markdown code fences
  const jsonStr = raw.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const result = JSON.parse(jsonStr) as AiEnrichResult;
  return result;
}

export function applyAiEnrichment(sessionId: string): { title: string; annotations: number } {
  const result = aiEnrichSession(sessionId);
  const db = getDb();

  // Update title
  db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(result.title, sessionId);

  // Delete existing AI annotations for this session
  db.prepare(`DELETE FROM annotations WHERE session_id = ? AND tags_json LIKE '%"ai"%'`).run(sessionId);

  // Create AI annotations
  let annCount = 0;
  for (const ann of result.annotations) {
    const type = (['risk_flag', 'decision_note', 'override_record', 'constraint_note'].includes(ann.type)
      ? ann.type
      : 'decision_note') as AnnotationType;
    createAnnotation({
      session_id: sessionId,
      type,
      content: ann.content,
      tags: ['ai'],
    });
    annCount++;
  }

  return { title: result.title, annotations: annCount };
}
