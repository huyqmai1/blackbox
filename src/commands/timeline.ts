import { Command } from 'commander';
import chalk from 'chalk';
import { getEvents } from '../storage/events.js';
import { getSession, type Session } from '../storage/sessions.js';
import { getAnnotations } from '../storage/annotations.js';
import { renderTimeline, mergeTimeline } from '../ui/timeline-renderer.js';
import { resolveSessionId } from '../utils/resolve-session.js';

export const timelineCommand = new Command('timeline')
  .description('View the decision timeline')
  .option('--session <id>', 'Show specific session (prefix match)')
  .option('--since <date>', 'Filter events since date (ISO 8601 or relative like "24h")')
  .option('--type <type>', 'Filter by event type')
  .option('--search <query>', 'Full-text search in event data')
  .option('--expand', 'Show full event content (no truncation)')
  .option('--limit <n>', 'Maximum events to show', '100')
  .action((options: {
    session?: string;
    since?: string;
    type?: string;
    search?: string;
    expand?: boolean;
    limit: string;
  }) => {
    const since = resolveSince(options.since);

    // Resolve session ID by prefix match
    let sessionId: string | undefined;
    if (options.session) {
      sessionId = resolveSessionId(options.session);
      if (!sessionId) {
        console.error(chalk.red(`Session not found: ${options.session}`));
        process.exit(1);
      }
    }

    const events = getEvents({
      session_id: sessionId,
      type: options.type,
      since,
      search: options.search,
      limit: parseInt(options.limit, 10),
    });

    // Fetch annotations for the relevant sessions
    const annotations = getAnnotations({
      session_id: sessionId,
      since,
    });

    const items = mergeTimeline(events, annotations);

    if (items.length === 0) {
      console.log(chalk.dim('No events found.'));
      return;
    }

    // Build session map for headers
    const sessionIds = [...new Set(items.map(i => i.data.session_id).filter(Boolean))] as string[];
    const sessionMap = new Map<string, Session>();
    for (const sid of sessionIds) {
      const s = getSession(sid);
      if (s) sessionMap.set(sid, s);
    }

    renderTimeline(items, { expand: options.expand, sessionMap });
    console.log();
    const annotationCount = annotations.length;
    const eventCount = events.length;
    const parts: string[] = [];
    if (eventCount > 0) parts.push(`${eventCount} event(s)`);
    if (annotationCount > 0) parts.push(`${annotationCount} annotation(s)`);
    console.log(chalk.dim(`${parts.join(', ')} shown.`));
  });

function resolveSince(since?: string): string | undefined {
  if (!since) {
    // Default: last 24 hours
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d.toISOString();
  }

  // Support relative formats like "24h", "7d", "1w"
  const relativeMatch = since.match(/^(\d+)([hdwm])$/);
  if (relativeMatch) {
    const [, numStr, unit] = relativeMatch;
    const num = parseInt(numStr, 10);
    const d = new Date();

    switch (unit) {
      case 'h': d.setHours(d.getHours() - num); break;
      case 'd': d.setDate(d.getDate() - num); break;
      case 'w': d.setDate(d.getDate() - num * 7); break;
      case 'm': d.setMonth(d.getMonth() - num); break;
    }

    return d.toISOString();
  }

  // Assume ISO 8601
  return since;
}
