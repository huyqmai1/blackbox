import Anthropic from '@anthropic-ai/sdk';
import { getEvents } from '../storage/events.js';
import { getDb } from '../storage/db.js';
import { createAnnotation, type AnnotationType } from '../storage/annotations.js';
import { getApiKey } from '../utils/config.js';

interface AiEnrichResult {
  title: string;
  summary: string;
  annotations: Array<{
    type: string;
    content: string;
    event_id?: number;
  }>;
}

interface BatchEnrichResult {
  session_id: string;
  title: string;
  annotations: Array<{
    type: string;
    content: string;
    event_id?: number;
  }>;
}

export interface EnrichAllOptions {
  force?: boolean;
  concurrency?: number;
  batchSize?: number;
  onProgress?: (done: number, total: number, errors: number) => void;
}

export function buildSessionSummary(sessionId: string): string {
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

  // Event timeline with IDs
  for (const ev of events) {
    try {
      const data = JSON.parse(ev.data_json);
      if (ev.type === 'user_prompt') {
        const content = String(data.content || '').trim();
        if (content && !content.startsWith('<')) {
          parts.push(`[Event #${ev.id}] [User] ${content.slice(0, 500)}`);
        }
      } else if (ev.type === 'ai_response') {
        const content = String(data.content || '').trim();
        if (content) parts.push(`[Event #${ev.id}] [AI] ${content.slice(0, 300)}`);
      } else if (ev.type === 'tool_use') {
        const name = data.tool_name || 'unknown';
        let detail = name;
        if (name === 'Bash' && data.tool_input?.command) {
          detail += `: ${String(data.tool_input.command).slice(0, 150)}`;
        } else if (['Write', 'Edit'].includes(name) && data.tool_input?.file_path) {
          detail += `: ${data.tool_input.file_path}`;
        }
        parts.push(`[Event #${ev.id}] [Tool] ${detail}`);
      } else if (ev.type === 'tool_result') {
        if (data.is_error) {
          parts.push(`[Event #${ev.id}] [Error] ${String(data.content || '').slice(0, 200)}`);
        }
      }
    } catch { /* skip */ }
  }

  // Trim to reasonable size for Claude context
  const full = parts.join('\n');
  if (full.length > 8000) return full.slice(0, 8000) + '\n...(truncated)';
  return full;
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Set ANTHROPIC_API_KEY or run: blackbox config set anthropic_api_key <key>');
  }
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

function buildBatchPrompt(sessionSummaries: Array<{ id: string; summary: string }>): string {
  let prompt = `You are analyzing AI coding session logs. For each session below, return ONLY a valid JSON array (no markdown, no code fences) with one object per session containing:
- "session_id": the session ID (echo it back exactly)
- "title": concise 3-8 word title describing what was accomplished
- "annotations": array of objects with "type" (one of: risk_flag, decision_note) and "content" (concise description), identifying key architectural decisions, risks taken, or notable patterns. Only include genuinely important items. Use an empty array if nothing notable.

Return the JSON array with exactly ${sessionSummaries.length} objects, one per session, in the same order.

`;

  for (let i = 0; i < sessionSummaries.length; i++) {
    prompt += `--- Session ${i + 1} (ID: ${sessionSummaries[i].id}) ---\n`;
    prompt += sessionSummaries[i].summary;
    prompt += '\n\n';
  }

  return prompt;
}

export function getSessionLastHash(sessionId: string): string | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT hash FROM events WHERE session_id = ? ORDER BY id DESC LIMIT 1'
  ).get(sessionId) as { hash: string } | undefined;
  return row?.hash ?? null;
}

export function needsEnrichment(session: { id: string; enriched_at: string | null; enriched_hash: string | null }, force: boolean): boolean {
  if (force) return true;
  if (!session.enriched_at) return true;
  const lastHash = getSessionLastHash(session.id);
  if (!lastHash) return false; // no events, nothing to enrich
  return lastHash !== session.enriched_hash;
}

export async function aiEnrichSession(sessionId: string): Promise<AiEnrichResult> {
  const summary = buildSessionSummary(sessionId);

  const prompt = `You are analyzing an AI coding assistant session log. Each event has an ID like [Event #123]. Based on the session data below, return ONLY valid JSON (no markdown, no code fences) with:
- "title": a concise 3-8 word title describing what was accomplished
- "summary": a 1-2 sentence summary of the session
- "annotations": array of objects with:
  - "type": one of "risk_flag" or "decision_note"
  - "content": concise description of the decision or risk
  - "event_id": the numeric event ID (from [Event #ID]) this annotation is most relevant to. Each annotation MUST reference a specific event.

Identify key architectural decisions, risks taken, or notable patterns. Only include genuinely important items, not trivial observations. Return an empty array if nothing notable.

Session data:
${summary}`;

  const raw = await callClaude(prompt);

  const jsonStr = raw.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const result = JSON.parse(jsonStr) as AiEnrichResult;
  return result;
}

async function aiEnrichBatch(sessionIds: string[]): Promise<BatchEnrichResult[]> {
  const sessionSummaries = sessionIds.map(id => ({
    id,
    summary: buildSessionSummary(id),
  }));

  const prompt = buildBatchPrompt(sessionSummaries);
  const raw = await callClaude(prompt);

  // Parse JSON — handle potential markdown code fences
  const jsonStr = raw.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const results = JSON.parse(jsonStr) as BatchEnrichResult[];

  if (!Array.isArray(results)) {
    throw new Error('Expected JSON array from batch response');
  }

  return results;
}

export async function applyAiEnrichment(sessionId: string): Promise<{ title: string; annotations: number }> {
  const result = await aiEnrichSession(sessionId);
  return applyEnrichmentResult(sessionId, result);
}

function applyEnrichmentResult(
  sessionId: string,
  result: { title: string; annotations: Array<{ type: string; content: string; event_id?: number }> }
): { title: string; annotations: number } {
  const db = getDb();
  const lastHash = getSessionLastHash(sessionId);

  // Update title, enriched_at, and enriched_hash
  db.prepare(
    'UPDATE sessions SET title = ?, enriched_at = ?, enriched_hash = ? WHERE id = ?'
  ).run(result.title, new Date().toISOString(), lastHash, sessionId);

  // Delete existing AI annotations for this session
  db.prepare(`DELETE FROM annotations WHERE session_id = ? AND tags_json LIKE '%"ai"%'`).run(sessionId);

  // Validate event IDs belong to this session
  const validEventIds = new Set(
    (db.prepare('SELECT id FROM events WHERE session_id = ?').all(sessionId) as Array<{ id: number }>).map(r => r.id)
  );

  // Create AI annotations
  let annCount = 0;
  for (const ann of result.annotations) {
    const type = (['risk_flag', 'decision_note', 'override_record', 'constraint_note'].includes(ann.type)
      ? ann.type
      : 'decision_note') as AnnotationType;
    const eventId = ann.event_id && validEventIds.has(ann.event_id) ? ann.event_id : undefined;
    createAnnotation({
      session_id: sessionId,
      event_id: eventId,
      type,
      content: ann.content,
      tags: ['ai'],
    });
    annCount++;
  }

  return { title: result.title, annotations: annCount };
}

export async function aiEnrichAll(options: EnrichAllOptions = {}): Promise<{ enriched: number; skipped: number; errors: number }> {
  const { force = false, concurrency = 3, batchSize = 10, onProgress } = options;
  const db = getDb();

  // Get all sessions with enrichment state
  const sessions = db.prepare(
    'SELECT id, enriched_at, enriched_hash FROM sessions'
  ).all() as Array<{ id: string; enriched_at: string | null; enriched_hash: string | null }>;

  // Filter to sessions that need enrichment
  const toEnrich = sessions.filter(s => needsEnrichment(s, force));

  if (toEnrich.length === 0) {
    return { enriched: 0, skipped: sessions.length, errors: 0 };
  }

  let enriched = 0;
  let errors = 0;
  const skipped = sessions.length - toEnrich.length;
  const sessionIds = toEnrich.map(s => s.id);

  // Split into batches of batchSize
  const batches: string[][] = [];
  for (let i = 0; i < sessionIds.length; i += batchSize) {
    batches.push(sessionIds.slice(i, i + batchSize));
  }

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      concurrentBatches.map(async (batchIds) => {
        try {
          const batchResults = await aiEnrichBatch(batchIds);

          // Apply results — match by session_id
          for (const batchId of batchIds) {
            const result = batchResults.find(r => r.session_id === batchId);
            if (result) {
              applyEnrichmentResult(batchId, result);
              enriched++;
            } else {
              // Result missing for this session — treat as error, fallback
              errors++;
            }
            onProgress?.(enriched + errors, toEnrich.length, errors);
          }
        } catch {
          // Entire batch failed — fall back for each session
          for (const batchId of batchIds) {
            errors++;
            onProgress?.(enriched + errors, toEnrich.length, errors);
          }
        }
      })
    );
  }

  return { enriched, skipped, errors };
}
