import { Command } from 'commander';
import chalk from 'chalk';
import { getAdapter, getAllAdapters, getAdapterNames, discoverAllSessions } from '../ingest/registry.js';
import type { DiscoveredSession } from '../ingest/agent-adapter.js';
import { createSession, sessionExistsBySourceId } from '../storage/sessions.js';
import { appendEvent } from '../storage/events.js';

export const ingestCommand = new Command('ingest')
  .description('Import existing AI agent session logs into BlackBox')
  .option('--source <source>', 'Log source (all, ' + getAdapterNames().join(', ') + ')', 'all')
  .option('--session <id>', 'Import a specific session by ID')
  .option('--all', 'Import all discovered sessions')
  .option('--since <date>', 'Only import sessions modified since date (ISO 8601)')
  .action(async (options: { source: string; session?: string; all?: boolean; since?: string }) => {
    // Validate source
    if (options.source !== 'all' && !getAdapter(options.source)) {
      console.error(chalk.red(`Unsupported source: ${options.source}. Available: all, ${getAdapterNames().join(', ')}`));
      process.exit(1);
    }

    // Discover sessions
    let discovered: DiscoveredSession[];
    if (options.source === 'all') {
      discovered = discoverAllSessions(options.since);
    } else {
      discovered = getAdapter(options.source)!.discoverSessions(options.since);
    }

    if (discovered.length === 0) {
      console.log(chalk.dim('No sessions found.'));
      return;
    }

    // Filter by specific session if requested
    let toImport = discovered;
    if (options.session) {
      toImport = discovered.filter(s =>
        s.sourceSessionId === options.session || s.sourceSessionId.startsWith(options.session!)
      );
      if (toImport.length === 0) {
        console.error(chalk.red(`Session not found: ${options.session}`));
        process.exit(1);
      }
    } else if (!options.all) {
      // Default: show what's available and ask to use --all
      const agentCounts: Record<string, number> = {};
      for (const s of discovered) {
        agentCounts[s.agentName] = (agentCounts[s.agentName] || 0) + 1;
      }
      const summary = Object.entries(agentCounts).map(([a, c]) => `${c} ${a}`).join(', ');
      console.log(chalk.yellow(`Found ${discovered.length} session(s) (${summary}).`));
      console.log(chalk.dim('Use --all to import all, or --session <id> for a specific one.'));
      console.log();

      // Show a preview of the last few
      const preview = discovered.slice(-5);
      for (const s of preview) {
        const agentTag = chalk.magenta(`[${s.agentName}]`);
        console.log(`  ${chalk.cyan(s.sourceSessionId.slice(0, 8))}  ${agentTag} ${s.projectSlug}  ${s.mtime.toLocaleString()}`);
      }
      if (discovered.length > 5) {
        console.log(chalk.dim(`  ... and ${discovered.length - 5} more`));
      }
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const disc of toImport) {
      const adapter = getAdapter(disc.agentName);
      if (!adapter) { skipped++; continue; }

      // Check for duplicates
      if (sessionExistsBySourceId(disc.sourceSessionId)) {
        skipped++;
        continue;
      }

      // Skip internal sessions (e.g., blackbox enrichment sessions for Claude Code)
      if (adapter.isInternalSession) {
        const parsed = adapter.parseSession(disc);
        if (adapter.isInternalSession(parsed.entries)) {
          skipped++;
          continue;
        }
      }

      const parsed = adapter.parseSession(disc);

      // Create BlackBox session
      const session = createSession({
        source: `ingest:${disc.agentName}`,
        agent: disc.agentName,
        cwd: parsed.cwd,
        started_at: parsed.startedAt,
        metadata_json: JSON.stringify({
          source_session_id: disc.sourceSessionId,
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
          source: `ingest:${disc.agentName}`,
          project_slug: disc.projectSlug,
          cwd: parsed.cwd,
          model: parsed.model,
        },
      });

      // Map and insert events
      let eventCount = 0;
      for (const entry of parsed.entries) {
        const mapped = adapter.mapEntryToEvents(entry);
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
          source: `ingest:${disc.agentName}`,
        },
      });

      // Update session ended_at
      const { getDb } = await import('../storage/db.js');
      getDb().prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`)
        .run(parsed.endedAt, session.id);

      imported++;
      const agentTag = chalk.magenta(`[${disc.agentName}]`);
      console.log(
        `  ${chalk.green('+')} ${disc.sourceSessionId.slice(0, 8)} ${agentTag} ${disc.projectSlug} — ${eventCount} events`
      );
    }

    console.log();
    console.log(chalk.green(`Imported ${imported} session(s).`) + (skipped > 0 ? chalk.dim(` Skipped ${skipped} already imported.`) : ''));
  });
