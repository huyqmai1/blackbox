import { Command } from 'commander';
import chalk from 'chalk';
import { discoverSessions, parseSession, parseSessionFile, mapEntryToEvents, isEnrichmentSession } from '../ingest/claude-code.js';
import { createSession, sessionExistsBySourceId } from '../storage/sessions.js';
import { appendEvent } from '../storage/events.js';

export const ingestCommand = new Command('ingest')
  .description('Import existing AI agent session logs into BlackBox')
  .option('--source <source>', 'Log source', 'claude-code')
  .option('--session <id>', 'Import a specific session by ID')
  .option('--all', 'Import all discovered sessions')
  .option('--since <date>', 'Only import sessions modified since date (ISO 8601)')
  .action(async (options: { source: string; session?: string; all?: boolean; since?: string }) => {
    if (options.source !== 'claude-code') {
      console.error(chalk.red(`Unsupported source: ${options.source}. Currently only 'claude-code' is supported.`));
      process.exit(1);
    }

    const discovered = discoverSessions(options.since);

    if (discovered.length === 0) {
      console.log(chalk.dim('No Claude Code sessions found.'));
      return;
    }

    // Filter by specific session if requested
    let toImport = discovered;
    if (options.session) {
      toImport = discovered.filter(s => s.sessionId === options.session || s.sessionId.startsWith(options.session!));
      if (toImport.length === 0) {
        console.error(chalk.red(`Session not found: ${options.session}`));
        process.exit(1);
      }
    } else if (!options.all) {
      // Default: show what's available and ask to use --all
      console.log(chalk.yellow(`Found ${discovered.length} Claude Code session(s).`));
      console.log(chalk.dim('Use --all to import all, or --session <id> for a specific one.'));
      console.log();

      // Show a preview of the first few
      const preview = discovered.slice(-5);
      for (const s of preview) {
        console.log(`  ${chalk.cyan(s.sessionId.slice(0, 8))}  ${s.projectSlug}  ${s.mtime.toLocaleString()}`);
      }
      if (discovered.length > 5) {
        console.log(chalk.dim(`  ... and ${discovered.length - 5} more`));
      }
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const disc of toImport) {
      // Check for duplicates
      if (sessionExistsBySourceId(disc.sessionId)) {
        skipped++;
        continue;
      }

      // Skip sessions created by blackbox enrichment (claude -p subprocess calls)
      const rawEntries = parseSessionFile(disc.sessionFile);
      if (isEnrichmentSession(rawEntries)) {
        skipped++;
        continue;
      }

      const parsed = parseSession(disc.projectSlug, disc.sessionFile, disc.sessionId);

      // Create BlackBox session
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
        }),
      });

      // Emit session_start event
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

      // Map and insert events
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

      // Emit session_end event
      appendEvent({
        session_id: session.id,
        type: 'session_end',
        timestamp: parsed.endedAt,
        data: {
          event_count: eventCount,
          source: 'ingest:claude-code',
        },
      });

      // Update session ended_at
      const { getDb } = await import('../storage/db.js');
      getDb().prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`)
        .run(parsed.endedAt, session.id);

      imported++;
      console.log(
        `  ${chalk.green('+')} ${disc.sessionId.slice(0, 8)} — ${disc.projectSlug} — ${eventCount} events`
      );
    }

    console.log();
    console.log(chalk.green(`Imported ${imported} session(s).`) + (skipped > 0 ? chalk.dim(` Skipped ${skipped} already imported.`) : ''));
  });
