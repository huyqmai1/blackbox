import { Command } from 'commander';
import chalk from 'chalk';
import { listSessions } from '../storage/sessions.js';
import { getEventCountsByType } from '../storage/events.js';

export const statusCommand = new Command('status')
  .description('Show stats for the most recent or active session')
  .option('--session <id>', 'Show status for a specific session')
  .action((options: { session?: string }) => {
    const sessions = listSessions({ limit: 1 });

    if (sessions.length === 0) {
      console.log(chalk.dim('No sessions found.'));
      return;
    }

    const session = sessions[0];
    const counts = getEventCountsByType(session.id);
    const metadata = session.metadata_json ? JSON.parse(session.metadata_json) : {};

    console.log();
    console.log(chalk.bold('Latest Session'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(`  ${chalk.bold('ID:')}          ${chalk.cyan(session.id.slice(0, 8))}`);
    console.log(`  ${chalk.bold('Source:')}      ${session.source}`);
    console.log(`  ${chalk.bold('Agent:')}       ${session.agent ?? chalk.dim('unknown')}`);
    console.log(`  ${chalk.bold('Started:')}     ${new Date(session.started_at).toLocaleString()}`);

    if (session.ended_at) {
      const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
      console.log(`  ${chalk.bold('Duration:')}    ${formatDuration(duration)}`);
    } else {
      console.log(`  ${chalk.bold('Status:')}      ${chalk.yellow('running')}`);
    }

    if (session.cwd) {
      console.log(`  ${chalk.bold('Directory:')}   ${session.cwd}`);
    }

    if (metadata.model) {
      console.log(`  ${chalk.bold('Model:')}       ${metadata.model}`);
    }

    console.log();
    console.log(chalk.bold('Event Summary'));
    console.log(chalk.dim('─'.repeat(50)));

    const totalEvents = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`  ${chalk.bold('Total events:')}  ${totalEvents}`);

    if (counts.user_prompt) {
      console.log(`  ${chalk.blue('User prompts:')} ${counts.user_prompt}`);
    }
    if (counts.ai_response) {
      console.log(`  ${chalk.green('AI responses:')} ${counts.ai_response}`);
    }
    if (counts.tool_use) {
      console.log(`  ${chalk.yellow('Tool uses:')}    ${counts.tool_use}`);
    }
    if (counts.tool_result) {
      console.log(`  ${chalk.dim('Tool results:')} ${counts.tool_result}`);
    }
    if (counts.file_change) {
      console.log(`  ${chalk.magenta('File changes:')} ${counts.file_change}`);
    }

    console.log();
  });

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
