import { Command } from 'commander';
import { execCommand } from './commands/exec.js';
import { sessionsCommand } from './commands/sessions.js';
import { ingestCommand } from './commands/ingest.js';
import { timelineCommand } from './commands/timeline.js';
import { statusCommand } from './commands/status.js';
import { closeDb } from './storage/db.js';

const program = new Command();

program
  .name('blackbox')
  .description('A dashcam for AI-assisted work — passive decision log for AI agent sessions')
  .version('0.1.0');

program.addCommand(execCommand);
program.addCommand(sessionsCommand);
program.addCommand(ingestCommand);
program.addCommand(timelineCommand);
program.addCommand(statusCommand);

// Ensure DB is closed on exit
process.on('exit', () => closeDb());
process.on('SIGINT', () => {
  closeDb();
  process.exit(130);
});

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
