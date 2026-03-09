// API handler functions for the web dashboard
// Thin wrappers around existing storage functions

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { listSessions, getSession, sessionExistsBySourceId, getSessionBySourceId, createSession } from '../storage/sessions.js';
import { getEvents, getEventCountsByType, appendEvent } from '../storage/events.js';
import {
  getAnnotations,
  createAnnotation,
  getAnnotationCountBySession,
  ANNOTATION_TYPES,
  type AnnotationType,
} from '../storage/annotations.js';
import { getFileChanges } from '../capture/file-tracker.js';
import { getDb } from '../storage/db.js';
import { discoverSessions, parseSession, parseSessionFile, mapEntryToEvents, isEnrichmentSession } from '../ingest/claude-code.js';
import { enrichSessionTitle } from '../analysis/title-generator.js';
import { autoAnnotateSession } from '../analysis/auto-annotate.js';
import { aiEnrichAll, applyAiEnrichment, needsEnrichment, getSessionLastHash, type EnrichAllOptions } from '../analysis/ai-enrich.js';
import { getApiKey, setConfig } from '../utils/config.js';

// Shared project name cleaning
function cleanProjectName(metadataJson: string | null, cwd: string | null): string {
  const meta = metadataJson ? JSON.parse(metadataJson) : {};
  const slug: string = meta.project_slug || '';
  if (slug) {
    const cleaned = slug.replace(/^-Users-[^-]+-/, '');
    if (cleaned && cleaned !== slug) return cleaned;
    if (slug.startsWith('-')) return slug.slice(1);
    return slug;
  }
  const dir: string = meta.cwd || cwd || '';
  if (dir) {
    const parts = dir.replace(/\/+$/, '').split('/');
    return parts[parts.length - 1] || dir;
  }
  return 'unknown';
}

export function handleApiSessions(searchParams: URLSearchParams): unknown[] {
  const since = searchParams.get('since') || undefined;
  const limitStr = searchParams.get('limit');
  // Empty string means "all sessions" — no limit
  const limit = (limitStr && limitStr.length > 0) ? parseInt(limitStr, 10) : undefined;

  const sessions = listSessions({ since, limit });

  return sessions.map((s) => ({
    ...s,
    annotation_count: getAnnotationCountBySession(s.id),
  }));
}

export function handleApiSession(id: string): unknown {
  const session = getSession(id);
  if (!session) return null;

  const event_counts = getEventCountsByType(id);
  const annotation_count = getAnnotationCountBySession(id);

  return { ...session, event_counts, annotation_count };
}

export function handleApiSessionEvents(id: string, searchParams: URLSearchParams): unknown[] {
  const type = searchParams.get('type') || undefined;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  return getEvents({ session_id: id, type, limit });
}

export function handleApiSessionAnnotations(id: string): unknown[] {
  return getAnnotations({ session_id: id });
}

export function handleApiSessionFiles(id: string): unknown[] {
  return getFileChanges(id);
}

export function handleApiEvents(searchParams: URLSearchParams): unknown[] {
  const search = searchParams.get('search') || undefined;
  const type = searchParams.get('type') || undefined;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 100;

  const results = getEvents({ search, type, limit: limit || undefined });
  // Enrich with session title for search results display
  const sessionCache: Record<string, string | null> = {};
  return results.map((ev: Record<string, unknown>) => {
    const sid = ev.session_id as string;
    if (!(sid in sessionCache)) {
      const s = getSession(sid);
      sessionCache[sid] = s?.title ?? null;
    }
    return { ...ev, session_title: sessionCache[sid] };
  });
}

export function handleApiCreateAnnotation(body: {
  session_id?: string;
  event_id?: number;
  type?: string;
  content?: string;
  tags?: string[];
}): unknown {
  if (!body.session_id || !body.type || !body.content) {
    throw new Error('Missing required fields: session_id, type, content');
  }
  if (!ANNOTATION_TYPES.includes(body.type as AnnotationType)) {
    throw new Error('Invalid annotation type. Must be one of: ' + ANNOTATION_TYPES.join(', '));
  }

  return createAnnotation({
    session_id: body.session_id,
    event_id: body.event_id,
    type: body.type as AnnotationType,
    content: body.content,
    tags: body.tags,
  });
}

export function handleApiStats(): unknown {
  const db = getDb();

  const totalSessions = (db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }).count;
  const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }).count;
  const totalAnnotations = (db.prepare('SELECT COUNT(*) as count FROM annotations').get() as { count: number }).count;
  const totalFileChanges = (db.prepare('SELECT COUNT(*) as count FROM file_changes').get() as { count: number }).count;

  const eventsByType = db.prepare(
    'SELECT type, COUNT(*) as count FROM events GROUP BY type ORDER BY count DESC'
  ).all() as Array<{ type: string; count: number }>;

  const annotationsByType = db.prepare(
    'SELECT type, COUNT(*) as count FROM annotations GROUP BY type ORDER BY count DESC'
  ).all() as Array<{ type: string; count: number }>;

  const dailyActivity = db.prepare(`
    SELECT date(timestamp) as date, COUNT(*) as count
    FROM events
    WHERE timestamp >= date('now', '-30 days')
    GROUP BY date(timestamp)
    ORDER BY date ASC
  `).all() as Array<{ date: string; count: number }>;

  return {
    total_sessions: totalSessions,
    total_events: totalEvents,
    total_annotations: totalAnnotations,
    total_file_changes: totalFileChanges,
    events_by_type: eventsByType,
    annotations_by_type: annotationsByType,
    daily_activity: dailyActivity,
  };
}

// --- Phase 5: Projects API ---

export function handleApiProjects(): unknown[] {
  const db = getDb();

  const sessions = db.prepare(`
    SELECT s.id, s.cwd, s.started_at, s.ended_at, s.metadata_json,
           COUNT(e.id) as event_count
    FROM sessions s
    LEFT JOIN events e ON e.session_id = s.id
    GROUP BY s.id
  `).all() as Array<{
    id: string; cwd: string | null; started_at: string;
    ended_at: string | null; metadata_json: string | null;
    event_count: number;
  }>;

  const projects: Record<string, {
    name: string;
    session_count: number;
    total_events: number;
    total_annotations: number;
    total_duration_ms: number;
    first_session: string;
    last_session: string;
  }> = {};

  for (const s of sessions) {
    const name = cleanProjectName(s.metadata_json, s.cwd);

    if (!projects[name]) {
      projects[name] = {
        name,
        session_count: 0,
        total_events: 0,
        total_annotations: 0,
        total_duration_ms: 0,
        first_session: s.started_at,
        last_session: s.started_at,
      };
    }

    const p = projects[name];
    p.session_count++;
    p.total_events += s.event_count;
    if (s.started_at && s.ended_at) {
      p.total_duration_ms += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
    }
    if (s.started_at < p.first_session) p.first_session = s.started_at;
    if (s.started_at > p.last_session) p.last_session = s.started_at;
  }

  const annotationCounts = db.prepare(`
    SELECT s.id as session_id, s.metadata_json, s.cwd, COUNT(a.id) as ann_count
    FROM sessions s
    INNER JOIN annotations a ON a.session_id = s.id
    GROUP BY s.id
  `).all() as Array<{ session_id: string; metadata_json: string | null; cwd: string | null; ann_count: number }>;

  for (const row of annotationCounts) {
    const name = cleanProjectName(row.metadata_json, row.cwd);
    if (projects[name]) {
      projects[name].total_annotations += row.ann_count;
    }
  }

  return Object.values(projects).sort((a, b) => b.session_count - a.session_count);
}

// --- Phase 6: Annotations list API ---

export function handleApiAnnotations(searchParams: URLSearchParams): unknown[] {
  const type = searchParams.get('type') || undefined;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 100;

  const annotations = getAnnotations({ type, limit: limit || undefined });

  return annotations.map((a) => {
    const session = a.session_id ? getSession(a.session_id) : null;
    return {
      ...a,
      session_started_at: session?.started_at ?? null,
      session_title: session?.title ?? null,
      project_name: session ? cleanProjectName(session.metadata_json, session.cwd) : '',
    };
  });
}

// --- Phase 8: Ingest API ---

let autoIngestTimer: ReturnType<typeof setInterval> | null = null;
let autoIngestIntervalMin = 0;

function runIngest(): { imported: number; skipped: number; updated: number } {
  const discovered = discoverSessions();
  let imported = 0;
  let skipped = 0;
  let updated = 0;
  const db = getDb();

  for (const disc of discovered) {
    // Skip sessions created by blackbox enrichment (claude -p subprocess calls)
    if (!getSessionBySourceId(disc.sessionId)) {
      const entries = parseSessionFile(disc.sessionFile);
      if (isEnrichmentSession(entries)) {
        skipped++;
        continue;
      }
    }

    const existing = getSessionBySourceId(disc.sessionId);

    if (existing) {
      // Check if source file has been modified since last import
      const meta = existing.metadata_json ? JSON.parse(existing.metadata_json) : {};
      const lastMtime = meta.source_mtime;
      const currentMtime = disc.mtime.toISOString();

      if (lastMtime && lastMtime >= currentMtime) {
        skipped++;
        continue;
      }

      // Re-import: delete old annotations, events, and file_changes, then re-parse
      db.prepare('DELETE FROM annotations WHERE session_id = ?').run(existing.id);
      db.prepare('DELETE FROM file_changes WHERE session_id = ?').run(existing.id);
      db.prepare('DELETE FROM events WHERE session_id = ?').run(existing.id);

      const parsed = parseSession(disc.projectSlug, disc.sessionFile, disc.sessionId);

      appendEvent({
        session_id: existing.id,
        type: 'session_start',
        timestamp: parsed.startedAt,
        data: {
          source: 'ingest:claude-code',
          project_slug: disc.projectSlug,
          cwd: parsed.cwd,
          model: parsed.model,
        },
      });

      let eventCount = 0;
      for (const entry of parsed.entries) {
        const mapped = mapEntryToEvents(entry);
        for (const evt of mapped) {
          appendEvent({
            session_id: existing.id,
            type: evt.type,
            timestamp: evt.timestamp,
            data: evt.data,
          });
          eventCount++;
        }
      }

      appendEvent({
        session_id: existing.id,
        type: 'session_end',
        timestamp: parsed.endedAt,
        data: { event_count: eventCount, source: 'ingest:claude-code' },
      });

      // Update session metadata with new mtime and timestamps
      const updatedMeta = {
        ...meta,
        source_mtime: currentMtime,
        model: parsed.model || meta.model,
      };
      const now = new Date().toISOString();
      db.prepare('UPDATE sessions SET ended_at = ?, metadata_json = ?, updated_at = ?, cwd = COALESCE(?, cwd) WHERE id = ?')
        .run(parsed.endedAt, JSON.stringify(updatedMeta), now, parsed.cwd || null, existing.id);

      // Enrich: generate title and auto-annotations
      enrichSessionTitle(existing.id);
      autoAnnotateSession(existing.id);

      updated++;
      continue;
    }

    const parsed = parseSession(disc.projectSlug, disc.sessionFile, disc.sessionId);
    const now = new Date().toISOString();

    const session = createSession({
      source: 'ingest:claude-code',
      agent: 'claude-code',
      cwd: parsed.cwd,
      started_at: parsed.startedAt,
      metadata_json: JSON.stringify({
        source_session_id: disc.sessionId,
        project_slug: disc.projectSlug,
        model: parsed.model,
        source_file: disc.sessionFile,
        source_mtime: disc.mtime.toISOString(),
      }),
    });

    appendEvent({
      session_id: session.id,
      type: 'session_start',
      timestamp: parsed.startedAt,
      data: {
        source: 'ingest:claude-code',
        project_slug: disc.projectSlug,
        cwd: parsed.cwd,
        model: parsed.model,
      },
    });

    let eventCount = 0;
    for (const entry of parsed.entries) {
      const mapped = mapEntryToEvents(entry);
      for (const evt of mapped) {
        appendEvent({
          session_id: session.id,
          type: evt.type,
          timestamp: evt.timestamp,
          data: evt.data,
        });
        eventCount++;
      }
    }

    appendEvent({
      session_id: session.id,
      type: 'session_end',
      timestamp: parsed.endedAt,
      data: { event_count: eventCount, source: 'ingest:claude-code' },
    });

    db.prepare('UPDATE sessions SET ended_at = ?, updated_at = ? WHERE id = ?').run(parsed.endedAt, now, session.id);

    // Enrich: generate title and auto-annotations
    enrichSessionTitle(session.id);
    autoAnnotateSession(session.id);

    imported++;
  }

  return { imported, skipped, updated };
}

export function handleIngestStatus(): unknown {
  const discovered = discoverSessions();
  let alreadyImported = 0;
  let filtered = 0;
  for (const disc of discovered) {
    if (sessionExistsBySourceId(disc.sessionId)) {
      alreadyImported++;
    } else {
      // Check if this would be skipped by the enrichment filter
      try {
        const entries = parseSessionFile(disc.sessionFile);
        if (isEnrichmentSession(entries)) filtered++;
      } catch { filtered++; }
    }
  }
  return {
    total_discovered: discovered.length,
    already_imported: alreadyImported,
    pending: discovered.length - alreadyImported - filtered,
    auto_ingest: autoIngestTimer !== null,
    auto_ingest_interval_min: autoIngestIntervalMin,
  };
}

export function handleIngest(): unknown {
  const result = runIngest();
  return result;
}

export function handleAutoIngest(body: { enabled?: boolean; interval_minutes?: number }): unknown {
  if (autoIngestTimer) {
    clearInterval(autoIngestTimer);
    autoIngestTimer = null;
    autoIngestIntervalMin = 0;
  }

  if (body.enabled) {
    const minutes = body.interval_minutes || 5;
    autoIngestIntervalMin = minutes;
    autoIngestTimer = setInterval(() => {
      try { runIngest(); } catch { /* ignore */ }
    }, minutes * 60 * 1000);
    // Run immediately on enable
    const result = runIngest();
    return { enabled: true, interval_minutes: minutes, ...result };
  }

  return { enabled: false };
}

// --- Enrichment API ---

let enrichmentRunning = false;
let enrichmentProgress: { done: number; total: number; errors: number } | null = null;
let enrichmentLastError: string | null = null;

export function handleEnrichmentStatus(): unknown {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }).count;
  const enriched = (db.prepare('SELECT COUNT(*) as count FROM sessions WHERE enriched_at IS NOT NULL').get() as { count: number }).count;

  // Count sessions that need re-enrichment (hash mismatch)
  const sessions = db.prepare(
    'SELECT id, enriched_at, enriched_hash FROM sessions'
  ).all() as Array<{ id: string; enriched_at: string | null; enriched_hash: string | null }>;
  const pending = sessions.filter(s => needsEnrichment(s, false)).length;

  return {
    total,
    enriched,
    pending,
    running: enrichmentRunning,
    progress: enrichmentProgress,
    has_api_key: !!getApiKey(),
    last_error: enrichmentLastError,
  };
}

export async function handleEnrichAll(body: {
  force?: boolean;
  concurrency?: number;
  batchSize?: number;
}): Promise<unknown> {
  if (enrichmentRunning) {
    return { error: 'Enrichment already running', progress: enrichmentProgress };
  }

  enrichmentRunning = true;
  enrichmentProgress = { done: 0, total: 0, errors: 0 };
  enrichmentLastError = null;

  // Run asynchronously — don't block the response
  const startTime = Date.now();
  aiEnrichAll({
    force: body.force,
    concurrency: body.concurrency || 3,
    batchSize: body.batchSize || 10,
    onProgress: (done, total, errors) => {
      enrichmentProgress = { done, total, errors };
    },
  }).then((result) => {
    enrichmentRunning = false;
    enrichmentProgress = { done: result.enriched + result.errors, total: result.enriched + result.errors + result.skipped, errors: result.errors };
  }).catch((err) => {
    enrichmentRunning = false;
    enrichmentLastError = err instanceof Error ? err.message : String(err);
  });

  return { started: true, progress: enrichmentProgress };
}

export async function handleEnrichSession(sessionId: string): Promise<unknown> {
  try {
    const result = await applyAiEnrichment(sessionId);
    return { success: true, ...result };
  } catch (err) {
    // Fall back to heuristic
    enrichSessionTitle(sessionId);
    autoAnnotateSession(sessionId);
    return { success: false, fallback: true, error: err instanceof Error ? err.message : String(err) };
  }
}

export function handleSetApiKey(body: { api_key?: string }): unknown {
  const key = body.api_key?.trim();
  if (!key || key.length < 10) {
    throw new Error('Invalid API key.');
  }
  setConfig({ anthropic_api_key: key });
  return { success: true };
}

// --- Phase 9: Plans API ---

function getPlansDir(): string {
  return join(homedir(), '.claude', 'plans');
}

export function handleApiPlans(): unknown[] {
  const plansDir = getPlansDir();
  if (!existsSync(plansDir)) return [];

  const files = readdirSync(plansDir).filter(f => f.endsWith('.md'));
  const db = getDb();

  return files.map(f => {
    const filePath = join(plansDir, f);
    const stat = statSync(filePath);
    const name = basename(f, '.md');

    // Extract actual title from first # heading
    let title = '';
    try {
      const content = readFileSync(filePath, 'utf-8');
      const firstLine = content.split('\n').find(l => l.trim().startsWith('#'));
      if (firstLine) title = firstLine.replace(/^#+\s*/, '').trim();
    } catch { /* ignore */ }

    // Try to find which session wrote this plan file
    let sessionId: string | null = null;
    let projectName = '';
    const row = db.prepare(
      `SELECT e.session_id FROM events e WHERE e.type = 'tool_use' AND e.data_json LIKE ? LIMIT 1`
    ).get(`%.claude/plans/${name}.md%`) as { session_id: string } | undefined;
    if (row) {
      sessionId = row.session_id;
      const session = getSession(row.session_id);
      if (session) projectName = cleanProjectName(session.metadata_json, session.cwd);
    }

    return {
      name,
      title: title || name,
      file: f,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      session_id: sessionId,
      project_name: projectName,
    };
  }).sort((a, b) => b.mtime.localeCompare(a.mtime));
}

export function handleApiPlan(name: string): unknown {
  const plansDir = getPlansDir();
  // Sanitize name to prevent path traversal
  const safeName = basename(name);
  const filePath = join(plansDir, safeName.endsWith('.md') ? safeName : safeName + '.md');

  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, 'utf-8');
  const stat = statSync(filePath);
  const db = getDb();

  // Extract actual title from first # heading
  let title = '';
  const firstHeading = content.split('\n').find(l => l.trim().startsWith('#'));
  if (firstHeading) title = firstHeading.replace(/^#+\s*/, '').trim();

  let sessionId: string | null = null;
  let projectName = '';
  const planName = basename(safeName, '.md');
  const row = db.prepare(
    `SELECT e.session_id FROM events e WHERE e.type = 'tool_use' AND e.data_json LIKE ? LIMIT 1`
  ).get(`%.claude/plans/${planName}.md%`) as { session_id: string } | undefined;
  if (row) {
    sessionId = row.session_id;
    const session = getSession(row.session_id);
    if (session) projectName = cleanProjectName(session.metadata_json, session.cwd);
  }

  return {
    name: planName,
    title: title || planName,
    content,
    size: stat.size,
    mtime: stat.mtime.toISOString(),
    session_id: sessionId,
    project_name: projectName,
  };
}
