import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { listSessions } from '../storage/sessions.js';
import { formatDuration } from '../utils/format.js';

export const sessionsCommand = new Command('sessions')
  .description('List captured sessions')
  .option('--since <date>', 'Filter sessions since date (ISO 8601)')
  .option('--limit <n>', 'Maximum sessions to show', '20')
  .action((options: { since?: string; limit: string }) => {
    const sessions = listSessions({
      since: options.since,
      limit: parseInt(options.limit, 10),
    });

    if (sessions.length === 0) {
      console.log(chalk.dim('No sessions found.'));
      return;
    }

    const table = new Table({
      head: [
        chalk.bold('ID'),
        chalk.bold('Source'),
        chalk.bold('Agent'),
        chalk.bold('Started'),
        chalk.bold('Duration'),
        chalk.bold('Events'),
      ],
      style: { head: [] },
    });

    for (const s of sessions) {
      const duration = s.ended_at
        ? formatDuration(new Date(s.ended_at).getTime() - new Date(s.started_at).getTime())
        : chalk.yellow('running');

      table.push([
        chalk.cyan(s.id.slice(0, 8)),
        s.source,
        s.agent ?? chalk.dim('—'),
        formatDate(s.started_at),
        duration,
        String(s.event_count),
      ]);
    }

    console.log(table.toString());
  });

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

