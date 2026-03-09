import { Command } from 'commander';
import { execWithCapture } from '../capture/pty-wrapper.js';

export const execCommand = new Command('exec')
  .description('Wrap an AI agent and capture its session')
  .argument('<command...>', 'Command to execute')
  .option('--cwd <dir>', 'Working directory')
  .option('--name <label>', 'Session label')
  .option('--no-prompt', 'Skip end-of-session annotation prompt')
  .action(async (command: string[], options: { cwd?: string; name?: string; prompt: boolean }) => {
    await execWithCapture({
      command,
      cwd: options.cwd,
      name: options.name,
      noPrompt: !options.prompt,
    });
  });
