import { Command } from 'commander';
import chalk from 'chalk';
import { listSessions } from '../storage/sessions.js';
import { getEventCountsByType } from '../storage/events.js';
import { getAnnotationCountBySession } from '../storage/annotations.js';
import { getFileChanges } from '../capture/file-tracker.js';
import { formatDuration } from '../utils/format.js';
import { resolveSessionId } from '../utils/resolve-session.js';

export const statusCommand = new Command('status')
  .description('Show stats for the most recent or active session')
  .option('--session <id>', 'Show status for a specific session')
  .action((options: { session?: string }) => {
    const sessionId = resolveSessionId(options.session);
    if (!sessionId) {
      console.log(chalk.dim('No sessions found.'));
      return;
    }

    const sessions = listSessions({ limit: 100 });
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error(chalk.red(`Session not found: ${options.session}`));
      return;
    }

    const counts = getEventCountsByType(session.id);
    const metadata = session.metadata_json ? JSON.parse(session.metadata_json) : {};

    console.log();
    console.log(chalk.bold('Session Details'));
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

    // Annotations
    const annotationCount = getAnnotationCountBySession(session.id);
    if (annotationCount > 0) {
      console.log(`  ${chalk.red('Annotations:')}  ${annotationCount}`);
    }

    // File changes detail
    const fileChanges = getFileChanges(session.id);
    if (fileChanges.length > 0) {
      console.log();
      console.log(chalk.bold('Files Changed'));
      console.log(chalk.dim('─'.repeat(50)));
      for (const fc of fileChanges.slice(0, 10)) {
        const icon = fc.change_type === 'added' ? chalk.green('+') : fc.change_type === 'deleted' ? chalk.red('-') : chalk.yellow('~');
        console.log(`  ${icon} ${fc.file_path}`);
      }
      if (fileChanges.length > 10) {
        console.log(chalk.dim(`  ... and ${fileChanges.length - 10} more`));
      }
    }

    console.log();
  });
